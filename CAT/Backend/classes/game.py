import logging
import uuid
import time
import json
from typing import Dict
from CAT.Backend.API.connection_manager import manager
from CAT.Backend.classes.figure import Figure
from CAT.Backend.classes.player import Player
from CAT.Backend.classes.deck import Deck
from CAT.Backend.classes.cards import *
from CAT.Backend.config import NUMBER_OF_FIELDS, MAX_PLAYERS, MIN_PLAYERS_TO_START, TURN_DURATION, FIGURES_PER_PLAYER
from .enums import PlayerColor

class NoActivePlayersError(Exception):
    """Custom exception raised when no active players are left in the game."""
    pass

class Game:
    """
    Represents a game session, managing players, turns, cards, and game logic.
    """
    NUMBER_OF_FIELDS = NUMBER_OF_FIELDS
    TURN_DURATION = TURN_DURATION

    def __init__(self, name, list_of_players: list[Player]):
        """
        Initializes a new Game instance with the given name and list of players.

        Args:
            name (str): The name of the game.
            list_of_players (list[Player]): The initial list of Player objects.
        """
        self.uuid = str(uuid.uuid4())
        self.name = name
        self.players = list_of_players
        self.host_id = list_of_players[0].uuid if list_of_players else None
        self.number_of_players = len(self.players)
        self.field_occupation: dict[int, Figure] = {}
        self.game_over = False
        self.deck = Deck(self.uuid)
        self.current_player_index = -1
        self.round_number = 1
        self.game_started = False
        self.last_played_card = None
        self.turn_start_time = None
        self.last_activity_time = time.time()
        self.game_over_time = None
        self.kick_votes: Dict[str, List[str]] = {}

    def start_game_and_deal_cards(self):
        """
        Starts the game and deals cards for the first time.

        Raises:
            ValueError: If the game has already started or not enough players are present.
        """
        self._update_last_activity()
        if self.game_started:
            raise ValueError("The game has already started.")
        if self.number_of_players < MIN_PLAYERS_TO_START:
            raise ValueError(f"At least {MIN_PLAYERS_TO_START} players are required to start the game.")

        self.game_started = True
        self.deck.deal_cards(self.players, self.round_number)
        logging.info(f"Game '{self.name}' started.", extra={"game_id": self.uuid})
        self.current_player_index = 0

        self._start_new_turn()

    def add_player(self, name: str):
        """
        Adds a new player to the game.

        Args:
            name (str): The name of the new player.

        Returns:
            Player: The newly added Player object.
        """
        self._update_last_activity()
        if self.number_of_players >= MAX_PLAYERS:
            raise ValueError(f"Cannot add more than {MAX_PLAYERS} players to the game.")
        new_player = Player(name, self.number_of_players)
        self.players.append(new_player)
        self.number_of_players += 1

        return new_player

    async def execute_play_card(self, player: Player, card_index: int, action_details: dict):
        """
        Executes the entire process of a player playing a card.

        Args:
            player (Player): The player who is playing the card.
            card_index (int): The index of the card in the player's hand.
            action_details (dict): Details for the card action.

        Raises:
            ValueError: If it's not the player's turn, the card index is invalid, or the game is over.
            IndexError: If the card index is out of bounds.
        """
        self._update_last_activity()
        if self._check_and_handle_timeout():
            raise ValueError("Your time is up! The turn was passed automatically.")

        if self.players[self.current_player_index] != player:
            raise ValueError("It's not your turn.")

        if card_index >= len(player.cards):
            raise IndexError("Card index is out of bounds.")

        if self.game_over:
            raise ValueError("The game is already over. No more actions can be performed.")

        card_to_play = player.cards[card_index]
        card_to_play.play_card(game_object=self, player=player, **action_details)

        played_card = player.cards.pop(card_index)
        self.deck.add_to_discard(played_card)
        self.last_played_card = played_card

        if await self.check_for_winner():
            logging.info(f"Game Over! Player {player.name} has won!", extra={"game_id": self.uuid})
            return

        try:
            if self.is_round_over():
                self.start_new_round()
            else:
                self.current_player_index = self._find_next_active_player_index(self.current_player_index)
                self._start_new_turn()
        except NoActivePlayersError:
            logging.info("Game Over: No active players left.", extra={"game_id": self.uuid})
            self.game_over = True

    def is_round_over(self) -> bool:
        """
        Checks if all players have played all their cards.

        Returns:
            bool: True if the round is over, False otherwise.
        """
        return all(len(p.cards) == 0 for p in self.players)

    def start_new_round(self):
        """
        Starts a new round with the correct number of cards and a new starting player.
        """
        self.round_number += 1
        try:
            self.current_player_index = self._find_next_active_player_index((self.round_number - 2) % self.number_of_players)
        except NoActivePlayersError:
            self.game_over = True
            return
        logging.info(f"\n--- Starting Round {self.round_number}---", extra={"game_id": self.uuid})
        logging.info(f"New starting player is {self.players[self.current_player_index].name}", extra={"game_id": self.uuid})

        self.deck.deal_cards(self.players, self.round_number)

        self._start_new_turn()

    def _start_new_turn(self):
        """
        Resets the turn timer and checks if the new player can move.
        """
        logging.info(f"Starting turn for player {self.players[self.current_player_index].name}", extra={"game_id": self.uuid})
        self.turn_start_time = time.time()
        self.check_and_skip_turn_if_no_moves()

    def _check_and_handle_timeout(self) -> bool:
        """
        If the current player's time is up, pass their turn and return True. Otherwise, return False.

        Returns:
            bool: True if the turn was passed due to timeout, False otherwise.
        """
        if self.game_started and self.turn_start_time and (time.time() - self.turn_start_time) > self.TURN_DURATION:
            logging.info(f"Server detected timeout for player {self.players[self.current_player_index].name}.", extra={"game_id": self.uuid})
            self.pass_turn(self.players[self.current_player_index])
            self._start_new_turn()
            return True
        return False

    async def check_timeout_and_broadcast(self):
        """
        Checks if the current player's time is up and broadcasts an update if so.
        """
        if self._check_and_handle_timeout():
            logging.info(f"Broadcasting update for game due to timeout (from background task).", extra={"game_id": self.uuid})
            await manager.broadcast(json.dumps({"event": "update"}), self.uuid)

    def _update_last_activity(self):
        """
        Updates the timestamp of the last activity.
        """
        self.last_activity_time = time.time()

    def _calculate_new_position(self, figure: Figure, value: int) -> int:
        """
        Calculates the new position for a figure, considering blockades and finish zone rules.

        Args:
            figure (Figure): The figure to move.
            value (int): The number of steps to move.

        Returns:
            int: The new position for the figure.

        Raises:
            ValueError: If the move is invalid due to blockades or finish zone rules.
        """
        player = self.get_spieler_von_figur(figure)
        old_pos = figure.get_position()

        path = []
        current_pos_on_path = old_pos
        # abs so -4 works as well (only then the path is backwards)
        for _ in range(abs(value)):
            current_pos_on_path = (current_pos_on_path + int(value/abs(value))) % self.NUMBER_OF_FIELDS
            path.append(current_pos_on_path)


        # checks the path for blockades
        for tile_pos in path[:-1]:
            if tile_pos in self.field_occupation:
                occupying_figure = self.field_occupation[tile_pos]
                owner = self.get_spieler_von_figur(occupying_figure)
                if tile_pos == owner.startfield:
                    raise ValueError(f"Path is blocked by a safe figure on tile {tile_pos}.")

        # finish zone handling
        if old_pos >= 100:
            current_finish_pos = old_pos % 100
            target_finish_pos = current_finish_pos + value
            if target_finish_pos < 0:
                raise ValueError("Cannot move backwards in the finish zone.")
            if target_finish_pos > 3:
                raise ValueError("Move would out of the finish area.")
            for i in range(old_pos + 1, old_pos + value + 1):
                if i in self.field_occupation:
                    raise ValueError(f"Cannot jump over figure in finish-zone at position {i}.")
            return old_pos + value
        else:
            finish_entry = player.finishing_field
            dist_to_finish = (finish_entry - old_pos + self.NUMBER_OF_FIELDS) % self.NUMBER_OF_FIELDS
            logging.debug(f"Distance to finish: {dist_to_finish}, Old position: {old_pos}, Value: {value}", extra={"game_id": self.uuid})
            if value > dist_to_finish + 1:
                if self.field_occupation.get(player.startfield) and self.field_occupation[player.startfield].color == player.color:
                    raise ValueError(f"Cannot go in finish-zone when start field is blocked.")
                steps_into_finish = value - dist_to_finish - 2  # -2 because you move over the start field and the first finishing field
                if steps_into_finish > 3:
                    return (old_pos + value) % self.NUMBER_OF_FIELDS
                for i in range(steps_into_finish + 1):
                    if ((player.get_number()+1) * 100 + i) in self.field_occupation:
                        return (old_pos + value) % self.NUMBER_OF_FIELDS
                return (player.get_number()+1) * 100 + steps_into_finish
            else:
                return (old_pos + value) % self.NUMBER_OF_FIELDS

    def has_any_valid_move(self, player: Player) -> bool:
        """
        Checks if the given player has any valid move with their current hand.

        Args:
            player (Player): The player to check.

        Returns:
            bool: True if the player has a valid move, False otherwise.
        """
        if not player.cards:
            return False

        for card in player.cards:
            if isinstance(card, JokerCard):
                # there is always a valid move with a JokerCard unless you won but then game should be over
                return True

        for card in player.cards:
            if isinstance(card, InfernoCard):
                moveable_figures = [f for f in player.figures if
                                    f.position >= 0]
                if not moveable_figures:
                    continue  # No figures on the board, so this card can't be played.

                def can_distribute(figures_to_check, points_left):
                    """
                    Recursively checks if a given number of points can be legally
                    distributed among a list of figures.

                    Args:
                        figures_to_check (list[Figure]): The figures to check for valid moves.
                        points_left (int): The number of points left to distribute.

                    Returns:
                        bool: True if the points can be distributed, False otherwise.
                    """
                    # BASE CASE 1: All points have been successfully assigned.
                    if points_left == 0:
                        return True

                    # BASE CASE 2: Failure. No figures are left, but there are still points to assign.
                    if not figures_to_check:
                        return False

                    current_figure = figures_to_check[0]
                    remaining_figures = figures_to_check[1:]

                    # start with points_left for better performance
                    for i in range(points_left, -1, -1):
                        if i == 0:
                            if can_distribute(remaining_figures, points_left):
                                return True
                            continue

                        try:
                            self._calculate_new_position(current_figure, i)
                            # If the move is valid, recursively check the rest of the figures and points.
                            if can_distribute(remaining_figures, points_left - i):
                                return True
                        except ValueError:
                            continue

                    # No valid moves found with points_left and remaining_figures
                    return False

                if can_distribute(moveable_figures, 7):
                    return True


            for figure in player.figures:
                try:
                    # case 1: start figure
                    if isinstance(card, StartCard) and figure.position == -1:
                        if not self.field_occupation.get(player.startfield):
                            return True

                    # case 2: move figure
                    if figure.position >= 0:
                        move_values = []
                        if isinstance(card, StandardCard):
                            move_values.append(card.value)
                        elif isinstance(card, StartCard):
                            move_values.extend(card.move_values)
                        elif isinstance(card, FlexCard):
                            move_values.extend([4, -4])

                        for value in move_values:
                            try:
                                self._calculate_new_position(figure, value)
                            except ValueError:
                                continue
                            return True  # no error -> valid move


                    # case 3: swap figure
                    if isinstance(card, SwapCard):
                        # 1. at least one own figure must be able to swap
                        own_swappable_figures = [f for f in player.figures if f.position >= 0 and f.position < 100 and f.position != player.startfield]
                        if not own_swappable_figures:
                            continue

                        # 2. at least one opponent figure must be available
                        for other_player in self.players:
                            if other_player.uuid == player.uuid:
                                continue

                            for opponent_figure in other_player.figures:
                                if opponent_figure.position >= 0 and opponent_figure.position < 100 and opponent_figure.position != other_player.startfield:
                                    return True

                        continue


                except ValueError:
                    # try next card or figure
                    continue

        return False

    def check_and_skip_turn_if_no_moves(self, recursion_count=0):
        """
        Checks the current player, and if they have no valid moves, discards their hand and moves to the next player recursively.
        Includes a safeguard against infinite recursion.

        Args:
            recursion_count (int): The current recursion depth (for safety).
        """
        # safetynet: so we don't end up in an infinite loop
        if recursion_count >= self.number_of_players:
            logging.info("All players skipped in a row. Force-starting a new round.", extra={"game_id": self.uuid})
            self.start_new_round()
            return

        current_player = self.players[self.current_player_index]

        if not self.has_any_valid_move(current_player):
            logging.info(f"Server check: Player {current_player.name} has no valid moves. Skipping turn.", extra={"game_id" : self.uuid})
            logging.debug(f"cards of player {current_player.name}: {current_player.cards}", extra={"game_id" : self.uuid})
            self.pass_turn(current_player)

            if self.is_round_over():
                self.start_new_round()
            else:
                self.check_and_skip_turn_if_no_moves(recursion_count + 1)

    def pass_turn(self, player: Player):
        """
        Discards the player's entire hand and passes the turn to the next player.
        This is used when a player cannot make any legal move.

        Args:
            player (Player): The player whose turn is being passed.

        Raises:
            ValueError: If it's not the player's turn.
        """
        if self.players[self.current_player_index] != player:
            raise ValueError("It's not this player's turn.")

        for card in player.cards:
            self.deck.add_to_discard(card)

        player.cards = []

        try:
            self.current_player_index = self._find_next_active_player_index(self.current_player_index)
        except NoActivePlayersError:
            logging.info("Game Over: No active players left.", extra={"game_id" : self.uuid})
            self.game_over = True

    def move_figure(self, figure: Figure, value: int):
        """
        Moves a figure by a given value, handling occupation and kicking logic.

        Args:
            figure (Figure): The figure to move.
            value (int): The number of steps to move the figure.

        Raises:
            ValueError: If the move is invalid or out of bounds.
        """
        if figure.get_position() < 0:
            raise ValueError("Figure is not on the board.")

        old_position = figure.get_position()
        if old_position >= 0:
            self.field_occupation.pop(old_position, None)

        new_position = self._calculate_new_position(figure, value)
        player_number = PlayerColor[figure.color.upper()].value
        if (new_position < 0 or new_position >= self.NUMBER_OF_FIELDS) and new_position not in [
            (player_number+1) * 100 + i  for i in range(4)]:
            logging.debug(f"if ({new_position} < 0 or {new_position} >= {self.NUMBER_OF_FIELDS}) and {new_position} not in {[
            (player_number + 1) * 100 + i  for i in range(4)]}:")
            logging.debug(f"if {new_position < 0 or new_position >= self.NUMBER_OF_FIELDS} and {new_position not in [
                (player_number + 1) * 100 + i for i in range(4)]}:")
            raise ValueError("New position is out of bounds.")
        if new_position in self.field_occupation:
            occupying_figure = self.field_occupation[new_position]
            if occupying_figure.get_position() != self.get_spieler_von_figur(occupying_figure).startfield:
                if occupying_figure.get_color() != figure.get_color():
                    logging.info(f"Figure {occupying_figure.get_uuid()} of color {occupying_figure.get_color()} is on the same field. It will be sent back to its start field.", extra={"game_id" : self.uuid})
                    occupying_figure.position = -1
                else:
                    raise ValueError("Cannot move to a field occupied by your own figure.")
            else:
                raise ValueError("Cannot move to a field occupied by a safe figure.")

        self.field_occupation[new_position] = figure
        figure.position = new_position
        logging.info(f"Figure moved from {old_position} to {new_position}.", extra={"game_id" : self.uuid})
        logging.debug(self.field_occupation, extra={"game_id" : self.uuid})

    def swap_figures(self, figure1: Figure, figure2: Figure):
        """
        Swaps the positions of two figures, respecting safe start tiles.

        Args:
            figure1 (Figure): The first figure to swap.
            figure2 (Figure): The second figure to swap.

        Raises:
            ValueError: If either figure is not swappable.
        """
        pos1 = figure1.position
        pos2 = figure2.position

        if pos1 < 0 or pos2 < 0 or pos1 >= 100 or pos2 >= 100:
            raise ValueError("Figures in the start or finish zone cannot be swapped.")


        owner1 = self.get_spieler_von_figur(figure1)
        if pos1 == owner1.startfield:
            raise ValueError(f"Cannot swap figure of {owner1.color} from its safe start tile.")
        owner2 = self.get_spieler_von_figur(figure2)
        if pos2 == owner2.startfield:
            raise ValueError(f"Cannot swap figure of {owner2.color} from its safe start tile.")

        figure1.position, figure2.position = pos2, pos1
        self.field_occupation[pos1], self.field_occupation[pos2] = figure2, figure1
        logging.info(f"Figures {figure1.get_uuid()} and {figure2.get_uuid()} have swapped positions.", extra={"game_id" : self.uuid})

    def get_figure_by_uuid(self, figure_uuid: str) -> Figure | None:
        """
        Finds any figure in the game by its UUID.

        Args:
            figure_uuid (str): The UUID of the figure to find.

        Returns:
            Figure | None: The found Figure object, or None if not found.
        """
        for player in self.players:
            for figure in player.figures:
                if figure.uuid == figure_uuid:
                    return figure
        return None

    def move_and_burn(self, figure: Figure, steps: int):
        """
        Moves a figure and burns any figures on its path.

        Args:
            figure (Figure): The figure to move.
            steps (int): The number of steps to move the figure.
        """
        if figure.position >= 100:
            new_position = self._calculate_new_position(figure, steps)
            self._execute_move(figure, new_position)
            return


        new_position = self._calculate_new_position(figure, steps)

        path_to_burn = []
        current_pos = figure.position

        temp_steps = steps
        if new_position >= 100:
            dist_to_finish = (self.get_spieler_von_figur(
                figure).finishing_field - figure.position + self.NUMBER_OF_FIELDS) % self.NUMBER_OF_FIELDS
            temp_steps = dist_to_finish + 1

        for _ in range(temp_steps):
            current_pos = (current_pos + 1) % self.NUMBER_OF_FIELDS
            path_to_burn.append(current_pos)

        for tile_pos in path_to_burn:
            if tile_pos in self.field_occupation:
                figure_to_burn = self.field_occupation[tile_pos]


                owner = self.get_spieler_von_figur(figure_to_burn)
                if tile_pos != owner.startfield:
                    logging.info(f"Figure {figure_to_burn.uuid} was burned at position {tile_pos}.", extra={"game_id" : self.uuid})
                    figure_to_burn.position = -1
                    del self.field_occupation[tile_pos]
                else:
                    raise ValueError(f"Path is blocked by a safe figure on tile {tile_pos}.")

        self._execute_move(figure, new_position)

    def start_figure(self, player: Player, figure: Figure):
        """
        Moves a figure from its home onto the player's starting tile.

        Args:
            player (Player): The player who owns the figure.
            figure (Figure): The figure to start.

        Raises:
            ValueError: If the figure is already in play or the start tile is blocked.
        """
        if figure.position != -1:  # -1 indicates home/start area
            raise ValueError("This figure is already in play.")

        start_tile = player.startfield

        if self.field_occupation.get(start_tile):
            if self.field_occupation[start_tile].color == figure.color:
                raise ValueError("The start tile is currently blocked by own figure.")

        self._execute_move(figure, start_tile)
        logging.info(f"Figure {figure.get_uuid()} is now on start tile {start_tile}.", extra={"game_id" : self.uuid})

    def _execute_move(self, figure: Figure, new_position: int):
        """
        Private helper that executes any move, respects safe figures, and handles kicking.

        Args:
            figure (Figure): The figure to move.
            new_position (int): The new position for the figure.
        """
        old_position = figure.position
        if old_position >= 0:
            self.field_occupation.pop(old_position, None)

        if new_position in self.field_occupation:
            kicked_figure = self.field_occupation[new_position]
            owner_of_kicked = self.get_spieler_von_figur(kicked_figure)

            if new_position == owner_of_kicked.startfield:
                if old_position >= 0:
                    self.field_occupation[old_position] = figure
                raise ValueError("Cannot land on a tile occupied by a safe figure.")

            logging.info(f"Figure {kicked_figure.get_uuid()} ({kicked_figure.get_color()}) was kicked.", extra={"game_id" : self.uuid})
            kicked_figure.position = -1

        figure.position = new_position
        if new_position >= 0:
            self.field_occupation[new_position] = figure
        logging.info(f"Figure moved from {old_position} to {new_position}.", extra={"game_id" : self.uuid})

    async def check_for_winner(self) -> bool:
        """
        Checks if any player has all their figures in the finishing zone.

        Returns:
            bool: True if a winner is found and the game is over, False otherwise.
        """
        for player in self.players:
            figures_in_finish = sum(1 for f in player.figures if f.position >= 100)
            if figures_in_finish == FIGURES_PER_PLAYER:
                self.game_over = True
                self.game_over_time = time.time()

                winner_name = player.name
                payload = {"event": "game_over", "winner": winner_name}
                logging.info(f"Game Over! Winner is {winner_name}. Broadcasting event.", extra={"game_id" : self.uuid})
                await manager.broadcast(json.dumps(payload), self.uuid)

                return True
        return False

    def register_kick_vote(self, voter: Player, player_to_kick_uuid: str):
        """
        Registers a vote to kick a player.

        Args:
            voter (Player): The player casting the vote.
            player_to_kick_uuid (str): The UUID of the player to kick.

        Returns:
            bool: True if the player was kicked, False otherwise.

        Raises:
            ValueError: If the vote is invalid (e.g., self-vote, inactive voter).
        """
        if player_to_kick_uuid not in self.kick_votes:
            self.kick_votes[player_to_kick_uuid] = []

        if voter.uuid == player_to_kick_uuid:
            raise ValueError("You cannot vote to kick yourself.")

        if not voter.is_active:
            raise ValueError("You cannot vote when you are inactive.")

        if voter.uuid not in self.kick_votes[player_to_kick_uuid]:
            self.kick_votes[player_to_kick_uuid].append(voter.uuid)


        required_votes = (self.number_of_players - 1) / 2
        if len(self.kick_votes[player_to_kick_uuid]) > required_votes and len(self.players) > MIN_PLAYERS_TO_START:
            player_to_kick = self.get_player_by_uuid(player_to_kick_uuid)
            if player_to_kick:
                logging.info(f"Player {player_to_kick.name} has been kicked by vote.", extra={"game_id" : self.uuid})
                player_to_kick.is_active = False
                for fig in player_to_kick.figures:
                    if fig.position in self.field_occupation:
                        del self.field_occupation[fig.position]
                    fig.position = -1

                if self.players[self.current_player_index] == player_to_kick:
                    try:
                        self.current_player_index = self._find_next_active_player_index(self.current_player_index)
                    except NoActivePlayersError:
                        logging.info("Game Over: No active players left after kick.", extra={"game_id" : self.uuid})
                        self.game_over = True

                del self.kick_votes[player_to_kick_uuid]
                return True
            return False

    def _find_next_active_player_index(self, start_index: int) -> int:
        """
        Finds the index of the next active player, starting from a given index.

        Args:
            start_index (int): The index to start searching from.

        Returns:
            int: The index of the next active player.

        Raises:
            NoActivePlayersError: If there are no active players left in the game.
        """
        next_index = (start_index + 1) % self.number_of_players
        while not self.players[next_index].is_active:
            next_index = (next_index + 1) % self.number_of_players
            if next_index == start_index:
                raise NoActivePlayersError("There are no active players left in the game.")
        return next_index

    def get_spieler_von_figur(self, figure: Figure) -> Player:
        """
        Returns the player who owns the given figure.

        Args:
            figure (Figure): The figure to look up.

        Returns:
            Player: The player who owns the figure.

        Raises:
            ValueError: If the figure is not found in any player's figures.
        """
        for player in self.players:
            if figure in player.figures:
                return player
        raise ValueError("Figure not found in any player's figures.")

    def get_player_by_number(self, number: int) -> Player | None:
        """
        Returns the player with the given number (0-3).

        Args:
            number (int): The player number to look up.

        Returns:
            Player | None: The found Player object, or None if not found.
        """
        for player in self.players:
            if player.number == number:
                return player
        return None

    def get_player_by_uuid(self, uuid) -> Player | None:
        """
        Returns the player with the given UUID.

        Args:
            uuid (str): The UUID of the player to find.

        Returns:
            Player | None: The found Player object, or None if not found.
        """
        for player in self.players:
            if player.get_uuid() == uuid:
                return player
        return None

    def get_name(self):
        """
        Returns the name of the game.

        Returns:
            str: The name of the game.
        """
        return self.name

    def to_json(self, perspective_player_id = None):
        """
        Converts the game object to a JSON serializable dictionary.
        This method ensures that all nested objects are also converted.

        Args:
            perspective_player_id (str, optional): The player ID for perspective-based serialization.

        Returns:
            dict: The game represented as a dictionary.
        """
        remaining_time = None
        if self.game_started and self.turn_start_time is not None:
            elapsed_time = time.time() - self.turn_start_time
            remaining_time = max(0, self.TURN_DURATION - int(elapsed_time))

        return {
            "uuid": self.uuid,
            "name": self.name,
            "players": [player.to_json(perspective_player_id) for player in self.players],
            "host_id": self.host_id,
            "number_of_players": self.number_of_players,
            "field_occupation": {str(k): v.to_json() for k, v in self.field_occupation.items()},
            "game_over": self.game_over,
            "current_player_index": self.current_player_index,
            "round_number": self.round_number,
            "game_started": self.game_started,
            "last_played_card": self.last_played_card.to_json() if self.last_played_card else None,
            "remaining_turn_time": remaining_time,
            "turn_duration": self.TURN_DURATION
        }