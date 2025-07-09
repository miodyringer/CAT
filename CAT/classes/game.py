import uuid
from CAT.classes.player import Player
from CAT.classes.figure import Figure
from CAT.classes.deck import Deck


class Game:
    NUMBER_OF_FIELDS = 54
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
        self.current_player_index = 0
        self.round_number = 1
        self.game_started = False

    def start_game_and_deal_cards(self):
        """Starts the game and deals cards for the first time."""
        if self.game_started:
            raise ValueError("The game has already started.")
        if self.number_of_players < 2:
            raise ValueError("At least two players are required to start the game.")

        self.game_started = True
        self.deck.deal_cards(self.players, self.round_number)
        print(f"Game '{self.name}' started. Dealt cards for round {self.round_number}.")

    def add_player(self, name: str):
        if self.number_of_players >= 4:
            raise ValueError("Cannot add more than 4 players to the game.")
        new_player = Player(name, self.number_of_players)
        self.players.append(new_player)
        self.number_of_players += 1

        return new_player


        Starts the game by setting the first player as the current player.

        if self.number_of_players < 2:
            raise ValueError("At least two players are required to start the game.")
        self.current_player = self.players[0]
        print(f"Game started with {self.number_of_players} players. Current player: {self.current_player.get_name()}")"""

    def execute_play_card(self, player: Player, card_index: int, action_details: dict):
        """
        Executes the entire process of a player playing a card.
        """
        if card_index >= len(player.cards):
            raise IndexError("Card index is out of bounds.")

        card_to_play = player.cards[card_index]

        # Hol die Figur aus den action_details
        figure_uuid = action_details.get("figure_uuid")
        if not figure_uuid:
            raise ValueError("Figure not provided in action_details.")

        figure_to_move = None
        for p in self.players:
            for fig in p.figures:
                if str(fig.uuid) == figure_uuid:
                    figure_to_move = fig
                    break
            if figure_to_move:
                break

        if not figure_to_move:
            raise ValueError("Figure not found.")

        # Hier wird die eigentliche Spiellogik der Karte aufgerufen
        # Wir übergeben die Figur als zusätzliches Argument an die play_card Methode
        card_to_play.play_card(game_object=self, player=player, figure=figure_to_move)

        # Karte aus der Hand des Spielers entfernen
        played_card = player.cards.pop(card_index)
        self.deck.add_to_discard(played_card)

        # Nächster Spieler ist an der Reihe
        self.current_player_index = (self.current_player_index + 1) % self.number_of_players

    def _calculate_new_position(self, figure: Figure, value: int) -> int:
        player = self.get_spieler_von_figur(figure)  # Eine Hilfsmethode, um den Besitzer einer Figur zu finden
        old_pos = figure.get_position()

        if old_pos < 100:
            distance_to_finishing_field = (player.finishing_field - old_pos) % self.NUMBER_OF_FIELDS
            if distance_to_finishing_field < value:
                steps_left = distance_to_finishing_field - value - 2  # -2 because the figure has to enter the finishing area over the start field so there are two extra steps till the finish
                if steps_left < 4:
                    return (player.number + 1) * 101 + steps_left

            new_pos = (old_pos + value) % self.NUMBER_OF_FIELDS
            return new_pos

        else:
            if old_pos % 10 + value < 4:
                return old_pos + value
            else:
                raise ValueError("Cannot move figure beyond the finishing area.")

    def move_figure(self, figure: Figure, value: int):
        if figure.get_position() < 0:
            raise ValueError("Figure is not on the board.")

        old_position = figure.get_position()
        if old_position >= 0:
            self.field_occupation.pop(old_position, None)

        new_position = self._calculate_new_position(figure, value)
        player_number = self.COLOR_PLAYER_MAPPING[figure.color]
        if (new_position < 0 or new_position >= self.NUMBER_OF_FIELDS) and new_position not in [
            player_number * 100 + i + 101 for i in range(4)]:
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

    def swap_figures(self, figure1: Figure, figure2: Figure):
        """Swaps the positions of two figures."""
        pos1 = figure1.position
        pos2 = figure2.position

        # Add validation logic (e.g., figures in home/finish cannot be swapped)
        if pos1 < 0 or pos2 < 0:
            raise ValueError("Figures in the start or finish zone cannot be swapped.")

        # Swap positions in the figure objects
        figure1.position = pos2
        figure2.position = pos1

        # Swap positions in the board layout dictionary
        self.field_occupation[pos1] = figure2
        self.field_occupation[pos2] = figure1

        print(f"Figures {figure1.get_uuid()} and {figure2.get_uuid()} have swapped positions.")

    def move_figure_backwards(self, figure: Figure, steps: int):
        """Moves a figure backwards."""
        # Note: Moving backwards typically ignores the finish line entry
        new_position = (figure.position - steps + self.NUMBER_OF_FIELDS) % self.NUMBER_OF_FIELDS
        # This now calls a dedicated "execute" method
        self._execute_move(figure, new_position)

    def start_figure(self, player: Player, figure: Figure):
        """Moves a figure from its home onto the player's starting tile."""
        if figure.position != -1:  # -1 indicates home/start area
            raise ValueError("This figure is already in play.")

        start_tile = player.startfield

        # Check if the player's own start tile is blocked
        if self.field_occupation.get(start_tile):
            raise ValueError("The start tile is currently blocked.")

        # Place the figure on the start tile
        self._execute_move(figure, start_tile)
        print(f"Figure {figure.get_uuid()} is now on start tile {start_tile}.")

    # It's good practice to refactor your move logic into a private "execute" method
    def _execute_move(self, figure: Figure, new_position: int):
        """
        Private helper that executes any move, updates figure and board state,
        and handles kicking other figures.
        """
        old_position = figure.position

        # 1. Clear the old position from the board layout
        if old_position >= 0:
            self.field_occupation.pop(old_position, None)

        # 2. Check if the target tile is occupied (kick logic)
        kicked_figure = self.field_occupation.get(new_position)
        if kicked_figure:
            print(f"Figure {kicked_figure.get_uuid()} ({kicked_figure.get_color()}) was kicked!")
            kicked_figure.position = -1  # Send it back to home

        # 3. Update the figure's own position
        figure.position = new_position

        # 4. Place the figure in its new position on the board layout
        if new_position >= 0:
            self.field_occupation[new_position] = figure

        print(f"Moved figure {figure.get_uuid()} from {old_position} to {new_position}.")

    def get_spieler_von_figur(self, figure: Figure) -> Player:
        for player in self.players:
            if figure in player.figures:
                return player
        raise ValueError("Figure not found in any player's figures.")

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
        return {
            "uuid": self.uuid,
            "name": self.name,
            "players": [player.to_json(perspective_player_id) for player in self.players],
            "host_id": self.host_id,
            "number_of_players": self.number_of_players,
            "field_occupation": {str(k): v.to_json() for k, v in self.field_occupation.items()},
            "game_over": self.game_over,
            #"deck": self.deck.to_json(),
            "current_player_index": self.current_player_index,
            "round_number": self.round_number,
            "game_started": self.game_started,
        }