from fastapi import APIRouter, Depends, HTTPException
# Füge PlayerInput zu dieser Import-Zeile hinzu
from CAT.API.schemas import CreateLobbyRequest, PlayerInput
from CAT.manager.game_manager import GameManager
from CAT.API.dependencies import get_game_manager

router = APIRouter(
    prefix="/lobby",
    tags=["Lobby"],
)


# Diese Funktion ist jetzt korrekt
@router.post("/create")
def create_lobby(request: CreateLobbyRequest, game_manager: GameManager = Depends(get_game_manager)):
    print("Received request to create lobby with data:", request.model_dump())
    new_game = game_manager.create_game(
        name=request.lobby_name,
        player_name=request.player_input.player_name
    )
    # Der erste Spieler in der Liste ist der Host
    host_player = new_game.players[0]
    return {
        "message": f"Lobby '{new_game.name}' created!",
        "game_id": new_game.uuid,
        "player_id": host_player.uuid  # Wichtig: Die ID des Hosts zurückgeben
    }

# Diese Funktion wird jetzt auch korrekt geladen, da PlayerInput bekannt ist
@router.post("/{game_id}/join")
def join_lobby(game_id: str, player_input: PlayerInput, game_manager: GameManager = Depends(get_game_manager)):
    """
    Adds a new player to an existing game lobby.
    """
    game = game_manager.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Füge den Spieler hinzu und erhalte das Objekt zurück
    new_player = game.add_player(player_input.player_name)
    return {
        "message": f"Player '{new_player.name}' joined lobby '{game.name}'",
        "player_id": new_player.uuid  # Wichtig: Die ID des neuen Spielers zurückgeben
    }

@router.get("/list")
def get_all_lobbies(game_manager: GameManager = Depends(get_game_manager)):
    """
    Returns a list of all active game lobbies.
    """
    return game_manager.games