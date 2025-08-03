from enum import Enum

class PlayerColor(Enum):
    GREEN = 0
    PINK = 1
    ORANGE = 2
    BLUE = 3

    @property
    def color_name(self) -> str:
        """Returns the name of the color in lowercase."""
        return self.name.lower()