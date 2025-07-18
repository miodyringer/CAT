import uuid
import time
import json
from typing import Dict, List
from CAT.API.connection_manager import manager
from CAT.classes.player import Player
from CAT.classes.figure import Figure
from CAT.classes.deck import Deck
from CAT.classes.cards import *
from CAT.config import NUMBER_OF_FIELDS, MAX_PLAYERS, MIN_PLAYERS_TO_START, TURN_DURATION, FIGURES_PER_PLAYER

class NoActivePlayersError(Exception):
    """Custom exception raised when no active players are left in the game."""
    pass

class Game:
    NUMBER_OF_FIELDS = NUMBER_OF_FIELDS
    COLOR_PLAYER_MAPPING = {
        "green": 0,
        "pink": 1,
        "orange": 2,
        "blue": 3
    }
    PLAYER_COLOR_MAPPING = {
        0: "green",
        1: "pink",
        2: "orange",
        3: "blue"
    }
    TURN_DURATION = TURN_DURATION

    def __init__(self, name, list_of_players: list[Player]):
        self.uuid = str(uuid.uuid4())
        self.name = name
        self.players = list_of_players
        self.host_id = list_of_players[0].uuid if list_of_players else None
        self.number_of_players = len(self.players)
        # {15: <Figure object of Player green>, 23: <Figure object of player pink> }
        self.field_occupation: dict[int, Figure] = {}
        self.game_over = False
        self.deck = Deck()
        self.current_player_index = -1
        self.round_number = 1
        self.game_started = False
        self.last_played_card = None
        self.turn_start_time = None
        self.last_activity_time = time.time()
        self.kick_votes: Dict[str, List[str]] = {}

    def start_game_and_deal_cards(self):
        """Starts the game and deals cards for the first time."""
        self._update_last_activity()
        if self.game_started:
            raise ValueError("The game has already started.")
        if self.number_of_players < MIN_PLAYERS_TO_START:
            raise ValueError(f"At least {MIN_PLAYERS_TO_START} players are required to start the game.")

        self.game_started = True
        self.deck.deal_cards(self.players, self.round_number)
        print(f"Game '{self.name}' started. Dealt cards for round {self.round_number}.")
        self.current_player_index = 0

        self._start_new_turn()

    def add_player(self, name: str):
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

        # Karte aus der Hand des Spielers entfernen
        played_card = player.cards.pop(card_index)
        self.deck.add_to_discard(played_card)
        self.last_played_card = played_card

        if await self.check_for_winner():
            print(f"Game Over! Player {player.name} has won!")
            return

        try:
            if self.is_round_over():
                self.start_new_round()
            else:
                self.current_player_index = self._find_next_active_player_index(self.current_player_index)
                self._start_new_turn()
        except NoActivePlayersError:
            print("Game Over: No active players left.")
            self.game_over = True

    def is_round_over(self) -> bool:
        """Checks if all players have played all their cards."""
        return all(len(p.cards) == 0 for p in self.players)

    def start_new_round(self):
        """Starts a new round with the correct number of cards and a new starting player."""
        self.round_number += 1
        try:
            self.current_player_index = self._find_next_active_player_index((self.round_number - 2) % self.number_of_players)
        except NoActivePlayersError:
            print("No active players left. Game over.")
            self.game_over = True
            return
        print(f"\n--- Starting Round {self.round_number} in game {self.name} ---")
        print(f"New starting player is {self.players[self.current_player_index].name}")

        self.deck.deal_cards(self.players, self.round_number)

        self._start_new_turn()

    def _start_new_turn(self):
        """Resets the turn timer and checks if the new player can move."""
        print(f"Starting turn for player {self.players[self.current_player_index].name}")
        self.turn_start_time = time.time()
        self.check_and_skip_turn_if_no_moves()

    def _check_and_handle_timeout(self) -> bool:
        """
        If the current player's time is up, pass their turn and return True.
        Otherwise, return False.
        """
        if self.game_started and self.turn_start_time and (time.time() - self.turn_start_time) > self.TURN_DURATION:
            print(f"Server detected timeout for player {self.players[self.current_player_index].name}.")
            self.pass_turn(self.players[self.current_player_index])
            self._start_new_turn()
            return True
        return False

    async def check_timeout_and_broadcast(self):
        """
        Checks if the current player's time is up and broadcasts an update if so.
        """
        if self._check_and_handle_timeout():
            print(f"Broadcasting update for game {self.uuid} due to timeout (from background task).")
            await manager.broadcast(json.dumps({"event": "update"}), self.uuid)

    def _update_last_activity(self):
        """Updates the timestamp of the last activity."""
        self.last_activity_time = time.time()

    def _calculate_new_position(self, figure: Figure, value: int) -> int:
        player = self.get_spieler_von_figur(figure)
        old_pos = figure.get_position()

        # path the figure will take
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
            print(f"Distance to finish: {dist_to_finish}, Old position: {old_pos}, Value: {value}")
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
        if not player.cards:
            return False

        for card in player.cards:
            if isinstance(card, JokerCard):
                # there is always a valid move with a JokerCard unless you won but then game should be over
                return True

        for card in player.cards:
            if isinstance(card, InfernoCard):
                moveable_figures = [f for f in player.figures if f.position >= 0]
                if not moveable_figures:
                    continue
                if len(moveable_figures) == 1:
                        try:
                            self._calculate_new_position(moveable_figures[0], 7)
                            return True
                        except ValueError:
                            continue
                elif len(moveable_figures) == 2:
                    for i in range(0,8):
                        try:
                            self._calculate_new_position(moveable_figures[0], i)
                            self._calculate_new_position(moveable_figures[1], 7-i)
                            return True
                        except ValueError:
                            continue
                elif len(moveable_figures) == 3:
                    for i in range(0,8):
                        for j in range(0,8-i):
                            try:
                                self._calculate_new_position(moveable_figures[0], i)
                                self._calculate_new_position(moveable_figures[1], j)
                                self._calculate_new_position(moveable_figures[2], 7-i-j)
                                return True
                            except ValueError:
                                continue
                elif len(moveable_figures) == 4:
                    for i in range(0,8):
                        for j in range(0,8-i):
                            for k in range(0,8-i-j):
                                try:
                                    self._calculate_new_position(moveable_figures[0], i)
                                    self._calculate_new_position(moveable_figures[1], j)
                                    self._calculate_new_position(moveable_figures[2], k)
                                    self._calculate_new_position(moveable_figures[3], 7-i-j-k)
                                    return True
                                except ValueError:
                                    continue


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
                            continue  # No swappable figures available

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
        Checks the current player, and if they have no valid moves,
        discards their hand and moves to the next player recursively.
        Includes a safeguard against infinite recursion.
        """
        # safetynet: so we don't end up in an infinite loop
        if recursion_count >= self.number_of_players:
            print("All players skipped in a row. Force-starting a new round.")
            self.start_new_round()
            return

        current_player = self.players[self.current_player_index]

        if not self.has_any_valid_move(current_player):
            print(f"Server check: Player {current_player.name} has no valid moves. Skipping turn.")
            print(f"cards of player {current_player.name}: {current_player.cards}")
            self.pass_turn(current_player)

            if self.is_round_over():
                self.start_new_round()
            else:
                self.check_and_skip_turn_if_no_moves(recursion_count + 1)

    def pass_turn(self, player: Player):
        """
        Discards the player's entire hand and passes the turn to the next player.
        This is used when a player cannot make any legal move.
        """
        if self.players[self.current_player_index] != player:
            raise ValueError("It's not this player's turn.")

        for card in player.cards:
            self.deck.add_to_discard(card)

        player.cards = []

        print(f"Player {player.name} cannot move and discards their hand.")
        try:
            self.current_player_index = self._find_next_active_player_index(self.current_player_index)
        except NoActivePlayersError:
            print("Game Over: No active players left.")
            self.game_over = True

    def move_figure(self, figure: Figure, value: int):
        if figure.get_position() < 0:
            raise ValueError("Figure is not on the board.")

        old_position = figure.get_position()
        if old_position >= 0:
            self.field_occupation.pop(old_position, None)

        new_position = self._calculate_new_position(figure, value)
        player_number = self.COLOR_PLAYER_MAPPING[figure.color]
        if (new_position < 0 or new_position >= self.NUMBER_OF_FIELDS) and new_position not in [
            (player_number+1) * 100 + i  for i in range(4)]:
            print(f"if ({new_position} < 0 or {new_position} >= {self.NUMBER_OF_FIELDS}) and {new_position} not in {[
            (player_number + 1) * 100 + i  for i in range(4)]}:")
            print(f"if {new_position < 0 or new_position >= self.NUMBER_OF_FIELDS} and {new_position not in [
                (player_number + 1) * 100 + i for i in range(4)]}:")
            raise ValueError("New position is out of bounds.")
        if new_position in self.field_occupation:
            occupying_figure = self.field_occupation[new_position]
            if occupying_figure.get_color() != figure.get_color():
                print(
                    f"Figure {occupying_figure.get_uuid()} of color {occupying_figure.get_color()} is on the same field. It will be sent back to its start field.")
                occupying_figure.position = -1
            else:
                raise ValueError("Cannot move to a field occupied by your own figure.")

        self.field_occupation[new_position] = figure
        figure.position = new_position
        print(f"Figure moved from {old_position} to {new_position}.")
        print(self.field_occupation)

    def swap_figures(self, figure1: Figure, figure2: Figure):
        """Swaps the positions of two figures, respecting safe start tiles."""
        pos1 = figure1.position
        pos2 = figure2.position

        # check if both figures are on the board
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
        print(f"Figures {figure1.get_uuid()} and {figure2.get_uuid()} have swapped positions.")

    def get_figure_by_uuid(self, figure_uuid: str) -> Figure | None:
        """Helper to find any figure in the game by its UUID."""
        for player in self.players:
            for figure in player.figures:
                if figure.uuid == figure_uuid:
                    return figure
        return None

    def move_and_burn(self, figure: Figure, steps: int):
        """
        Moves a figure and burns any figures on its path, with corrected logic.
        """
        # normal move when figure is in the finish zone
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
                    print(f"Figure {figure_to_burn.uuid} was burned at position {tile_pos}!")
                    figure_to_burn.position = -1
                    del self.field_occupation[tile_pos]
                else:
                    raise ValueError(f"Path is blocked by a safe figure on tile {tile_pos}.")

        self._execute_move(figure, new_position)

    def start_figure(self, player: Player, figure: Figure):
        """Moves a figure from its home onto the player's starting tile."""
        if figure.position != -1:  # -1 indicates home/start area
            raise ValueError("This figure is already in play.")

        start_tile = player.startfield

        # Check if the player's own start tile is blocked
        if self.field_occupation.get(start_tile):
            if self.field_occupation[start_tile].color == figure.color:
                raise ValueError("The start tile is currently blocked.")

        # Place the figure on the start tile
        self._execute_move(figure, start_tile)
        print(f"Figure {figure.get_uuid()} is now on start tile {start_tile}.")

    def _execute_move(self, figure: Figure, new_position: int):
        """
        Private helper that executes any move, respects safe figures, and handles kicking.
        """
        old_position = figure.position
        if old_position >= 0:
            self.field_occupation.pop(old_position, None)

        if new_position in self.field_occupation:
            kicked_figure = self.field_occupation[new_position]
            owner_of_kicked = self.get_spieler_von_figur(kicked_figure)

            # figure on own start field cannot be kicked
            if new_position == owner_of_kicked.startfield:
                if old_position >= 0:
                    self.field_occupation[old_position] = figure
                raise ValueError("Cannot land on a tile occupied by a safe figure.")

            print(f"Figure {kicked_figure.get_uuid()} ({kicked_figure.get_color()}) was kicked!")
            kicked_figure.position = -1

        figure.position = new_position
        if new_position >= 0:
            self.field_occupation[new_position] = figure
        print(f"Moved figure {figure.get_uuid()} from {old_position} to {new_position}.")

    async def check_for_winner(self) -> bool:
        """Checks if any player has all their figures in the finishing zone."""
        for player in self.players:
            figures_in_finish = sum(1 for f in player.figures if f.position >= 100)
            if figures_in_finish == FIGURES_PER_PLAYER:
                self.game_over = True

                winner_name = player.name
                payload = {"event": "game_over", "winner": winner_name}
                print(f"Game Over! Winner is {winner_name}. Broadcasting event.")
                await manager.broadcast(json.dumps(payload), self.uuid)

                return True
        return False

    def register_kick_vote(self, voter: Player, player_to_kick_uuid: str):
        """Registers a vote to kick a player."""
        if player_to_kick_uuid not in self.kick_votes:
            self.kick_votes[player_to_kick_uuid] = []

        if voter.uuid == player_to_kick_uuid:
            raise ValueError("You cannot vote to kick yourself.")

        if not voter.is_active:
            raise ValueError("You cannot vote when you are inactive.")

        if voter.uuid not in self.kick_votes[player_to_kick_uuid]:
            self.kick_votes[player_to_kick_uuid].append(voter.uuid)


        required_votes = (self.number_of_players - 1) / 2
        if len(self.kick_votes[player_to_kick_uuid]) > required_votes:
            player_to_kick = self.get_player_by_uuid(player_to_kick_uuid)
            if player_to_kick:
                print(f"Player {player_to_kick.name} has been kicked by vote.")
                player_to_kick.is_active = False
                for fig in player_to_kick.figures:
                    if fig.position in self.field_occupation:
                        del self.field_occupation[fig.position]
                    fig.position = -1

                if self.players[self.current_player_index] == player_to_kick:
                    try:
                        self.current_player_index = self._find_next_active_player_index(self.current_player_index)
                    except NoActivePlayersError:
                        print("Game Over: No active players left after kick.")
                        self.game_over = True

                del self.kick_votes[player_to_kick_uuid]
                return True
            return False

    def _find_next_active_player_index(self, start_index: int) -> int:
        """Finds the index of the next active player, starting from a given index."""
        next_index = (start_index + 1) % self.number_of_players
        while not self.players[next_index].is_active:
            next_index = (next_index + 1) % self.number_of_players
            if next_index == start_index:
                raise NoActivePlayersError("There are no active players left in the game.")
        return next_index

    def get_spieler_von_figur(self, figure: Figure) -> Player:
        for player in self.players:
            if figure in player.figures:
                return player
        raise ValueError("Figure not found in any player's figures.")

    def get_player_by_number(self, number: int) -> Player | None:
        """Returns the player with the given number (0-3)."""
        for player in self.players:
            if player.number == number:
                return player
        return None

    def get_player_by_uuid(self, uuid) -> Player | None:
        """
        Returns the player with the given UUID.
        """
        for player in self.players:
            if player.get_uuid() == uuid:
                return player
        return None

    def get_name(self):
        return self.name

    def to_json(self, perspective_player_id = None):
        """
        Convert the game object to a JSON serializable dictionary.
        This method ensures that all nested objects are also converted.
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