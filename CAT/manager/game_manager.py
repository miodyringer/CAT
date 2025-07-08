from CAT.classes.game import Game
from CAT.classes.player import Player

class GameManager:
    """
    Manages the game state and player interactions.
    """

    def __init__(self):
        self.games = {}

    def create_game(self, name: str, player_name) -> Game:
        """
        Creates a new game with the given name and players.
        """


        player_objects = [Player(player_name, 0)]
        game = Game(name, player_objects)
        self.games[game.uuid] = game
        return game

    def get_game(self, uuid: str) -> Game | None:
        """
        Returns the game with the given UUID.
        """
        return self.games.get(uuid)