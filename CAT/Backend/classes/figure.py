import uuid

class Figure():
    """
    Represents a game figure with a unique identifier, color, and position.
    """
    def __init__(self, color: str):
        """
        Initializes a new Figure instance with a unique UUID, color, and default position.

        Args:
            color (str): The color of the figure.
        """
        self.uuid = str(uuid.uuid4())
        self.color = color
        self.position = -1

    def get_position(self) -> int:
        """
        Returns the current position of the figure.

        Returns:
            int: The current position of the figure.
        """
        return self.position

    def get_color(self) -> str:
        """
        Returns the color of the figure.

        Returns:
            str: The color of the figure.
        """
        return self.color

    def get_uuid(self) -> str:
        """
        Returns the unique identifier (UUID) of the figure.

        Returns:
            str: The UUID of the figure.
        """
        return self.uuid

    def to_json(self):
        """
        Converts the figure to a JSON-compatible dictionary.

        Returns:
            dict: A dictionary representation of the figure.
        """
        return {
            'uuid': self.uuid,
            'color': self.color,
            'position': self.position
        }