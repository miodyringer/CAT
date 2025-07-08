from CAT.manager.game_manager import GameManager

# Create single instances of the managers that can be shared across the application
game_manager = GameManager()

def get_game_manager():
    return game_manager

