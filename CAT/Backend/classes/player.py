import uuid
from .cards import *
from .figure import Figure
from .enums import PlayerColor
from CAT.Backend.config import FIGURES_PER_PLAYER, NUMBER_OF_FIELDS

class Player:
    """
    Represents a player in the game, including their cards, figures, color, and state.
    """

    def __init__(self, name: str, number):
        """
        Initializes a new Player instance with a name, player number, color, and figures.

        Args:
            name (str): The name of the player.
            number (int): The player's number (used for color and start position).
        """
        self.uuid = str(uuid.uuid4())
        self.name: str = name
        self.number: int = number
        self.color = PlayerColor(number)
        self.cards: list[Card] = []
        self.figures: list[Figure] = [Figure(self.color.color_name) for _ in range(FIGURES_PER_PLAYER)]
        self.startfield = (number * 14) % NUMBER_OF_FIELDS
        self.finishing_field = (self.startfield - 1) % NUMBER_OF_FIELDS
        self.is_active = True

    def to_json(self, perspective_player_id=None):
        """
        Converts the player object to a JSON serializable dictionary,
        filtering sensitive information based on the requesting player.

        Args:
            perspective_player_id (str, optional): The player ID for perspective-based serialization.

        Returns:
            dict: The player represented as a dictionary.
        """
        if self.uuid == perspective_player_id:
            cards_data = [card.to_json() for card in self.cards]
            player_uuid = self.uuid
        else:
            cards_data = len(self.cards)
            player_uuid = None

        return {
            "uuid": player_uuid,
            "name": self.name,
            "number": self.number,
            "color": self.color.color_name,
            "cards": cards_data,
            "figures": [figure.to_json() for figure in self.figures],
            "is_active": self.is_active
        }


    def get_cards(self):
        """
        Retrieves the list of cards belonging to the player.

        Returns:
            list[Card]: The player's cards.
        """
        return self.cards

    def get_name(self):
        """
        Retrieves the name of the player.

        Returns:
            str: The player's name.
        """
        return self.name

    def get_uuid(self):
        """
        Retrieves the UUID of the player.

        Returns:
            str: The player's UUID.
        """
        return self.uuid

    def get_figures(self):
        """
        Retrieves the list of figures belonging to the player.

        Returns:
            list[Figure]: The player's figures.
        """
        return self.figures

    def get_number(self):
        """
        Retrieves the player number.

        Returns:
            int: The player's number.
        """
        return self.number

    def get_color(self):
        """
        Retrieves the color of the player.

        Returns:
            PlayerColor: The player's color.
        """
        return self.color

    def get_startfield(self):
        """
        Retrieves the starting field position for the player.

        Returns:
            int: The player's starting field position.
        """
        return self.startfield

    def get_finishing_field(self):
        """
        Retrieves the finishing field position for the player.

        Returns:
            int: The player's finishing field position.
        """
        return self.finishing_field