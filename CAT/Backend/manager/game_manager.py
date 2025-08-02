from CAT.Backend.classes.game import Game
from CAT.Backend.classes.player import Player

class GameManager:
    """
    Manages the game state and player interactions.
    """

    def __init__(self):
        """
        Initializes the GameManager with an empty dictionary of games.
        """
        self.games = {}

    def create_game(self, name: str, player_name) -> Game:
        """
        Creates a new game with the given name and a host player.

        Args:
            name (str): The name of the game.
            player_name (str): The name of the host player.

        Returns:
            Game: The newly created Game instance.
        """
        player_objects = [Player(player_name, 0)]
        game = Game(name, player_objects)
        self.games[game.uuid] = game
        return game

    def get_game(self, uuid: str) -> Game | None:
        """
        Returns the game with the given UUID.

        Args:
            uuid (str): The UUID of the game to retrieve.

        Returns:
            Game | None: The Game instance if found, otherwise None.
        """
        return self.games.get(uuid)