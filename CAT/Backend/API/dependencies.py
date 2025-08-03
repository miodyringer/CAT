from CAT.Backend.manager.game_manager import GameManager

# Create single instances of the manager that can be shared across the application
game_manager = GameManager()

def get_game_manager():
    """
    Dependency function to provide a singleton instance of GameManager.

    Returns:
        GameManager: The shared instance of the GameManager used throughout the application.
    """
    return game_manager