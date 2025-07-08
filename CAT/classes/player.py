import uuid
from .cards import *
from .figure import Figure

class Player:

    def __init__(self, name: str, number, color: str = None):
        self.uuid = str(uuid.uuid4())
        self.name: str = name
        self.number: int = number
        self.color = "green" if number == 0 else "pink" if number == 1 else "orange" if number == 2 else "blue"
        self.cards: list[Card] = []
        self.figures: list[Figure] = [Figure(self.color) for _ in range(4)]  # Each player starts with 4 figures
        self.startfield = number * 14  # Startfield is determined by the player number
        self.finishing_field = (self.startfield - 1) % 54 # Finishing field is the last field before the player's start field





    def to_json(self):
        """
        Convert the player object to a JSON serializable dictionary.
        """
        return {
            "uuid": self.uuid,
            "name": self.name,
            "number": self.number,
            "color": self.color,
            "cards": [card.to_json() for card in self.cards],
            "figures": [figure.to_json() for figure in self.figures],
            "startfield": self.startfield,
            "finishing_field": self.finishing_field
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