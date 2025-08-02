import uuid
from .cards import *
from .figure import Figure
from CAT.config import FIGURES_PER_PLAYER, NUMBER_OF_FIELDS

class Player:

    def __init__(self, name: str, number):
        self.uuid = str(uuid.uuid4())
        self.name: str = name
        self.number: int = number
        self.color = "green" if number == 0 else "pink" if number == 1 else "orange" if number == 2 else "blue"
        self.cards: list[Card] = []
        self.figures: list[Figure] = [Figure(self.color) for _ in range(FIGURES_PER_PLAYER)]
        self.startfield = (number * 14) % NUMBER_OF_FIELDS
        self.finishing_field = (self.startfield - 1) % NUMBER_OF_FIELDS
        self.is_active = True





    def to_json(self, perspective_player_id=None):
        """
        Convert the player object to a JSON serializable dictionary,
        filtering sensitive information based on the requesting player.
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
            "color": self.color,
            "cards": cards_data,
            "figures": [figure.to_json() for figure in self.figures],
            "is_active": self.is_active
        }


    def get_cards(self):
        return self.cards

    def get_name(self):
        return self.name

    def get_uuid(self):
        return self.uuid

    def get_figures(self):
        return self.figures

    def get_number(self):
        return self.number

    def get_color(self):
        return self.color

    def get_startfield(self):
        return self.startfield

    def get_finishing_field(self):
        return self.finishing_field