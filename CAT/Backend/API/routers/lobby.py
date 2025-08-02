import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from CAT.Backend.API.schemas import CreateLobbyRequest, PlayerInput
from CAT.Backend.manager.game_manager import GameManager
from CAT.Backend.API.dependencies import get_game_manager
from CAT.Backend.API.connection_manager import manager
from CAT.Backend.config import MAX_NAME_LENGTH

router = APIRouter(
    prefix="/lobby",
    tags=["Lobby"],
)


@router.post("/create")
def create_lobby(request: CreateLobbyRequest, game_manager: GameManager = Depends(get_game_manager)):
    if len(request.player_input.player_name) > MAX_NAME_LENGTH or len(request.lobby_name) > MAX_NAME_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Names cannot be longer than {MAX_NAME_LENGTH} characters."
        )

    logging.info(f"Received request to create lobby with data: {request.model_dump()}")
    new_game = game_manager.create_game(
        name=request.lobby_name,
        player_name=request.player_input.player_name
    )
    host_player = new_game.players[0]
    return {
        "message": f"Lobby '{new_game.name}' created!",
        "game_id": new_game.uuid,
        "player_id": host_player.uuid
    }

@router.post("/{game_id}/join")
async def join_lobby(game_id: str, player_input: PlayerInput, game_manager: GameManager = Depends(get_game_manager)):
    """
    Adds a new player to an existing game lobby.
    """
    game = game_manager.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")


    if len(player_input.player_name) > MAX_NAME_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Names cannot be longer than {MAX_NAME_LENGTH} characters."
        )
    new_player = game.add_player(player_input.player_name)
    if not new_player:
        raise HTTPException(status_code=400, detail="Failed to add player to the game")
    await manager.broadcast(json.dumps({"event": "update"}), game_id)
    return {
        "message": f"Player '{new_player.name}' joined lobby '{game.name}'",
        "player_id": new_player.uuid
    }

@router.get("/list")
def get_all_lobbies(game_manager: GameManager = Depends(get_game_manager)):
    """
    Returns a list of all active game lobbies.
    """
    return game_manager.games