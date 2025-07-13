import json
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from CAT.manager.game_manager import GameManager
from CAT.API.dependencies import get_game_manager
from CAT.API.schemas import PlayCardRequest, VoteKickRequest
from CAT.classes.cards import *
from CAT.API.connection_manager import manager


router = APIRouter(
    prefix="/game",
    tags=["Game"],
)

@router.websocket("/ws/{game_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, player_id: str):
    await manager.connect(websocket, game_id)
    try:
        while True:
            # Warte auf Nachrichten vom Client (aktuell nicht genutzt, aber für die Zukunft nötig)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id)
        print(f"Player {player_id} disconnected from game {game_id}")

@router.get("/{game_id}/state")
def get_game_state(game_id: str, player_id: str = Query(...), game_manager: GameManager = Depends(get_game_manager)):
    """
    Retrieves the current state of a specific game.
    """
    game = game_manager.get_game(game_id)
    if not game:
        return {"error": "Game not found"}
    # The game object will be automatically converted to JSON by FastAPI.
    # You might want to create a Pydantic schema for the game state for better control
    return game.to_json(perspective_player_id=player_id)


# Example of a future endpoint for playing a card
@router.post("/{game_id}/play")
async def play_card_action(game_id: str, request: PlayCardRequest, game_manager: GameManager = Depends(get_game_manager)):
    """
    Handles a player's action to play a card.
    """
    game = game_manager.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    player = game.get_player_by_uuid(request.player_uuid)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found in this game")
    if game.players[game.current_player_index] != player:
        raise HTTPException(status_code=400, detail="It's not your turn.")

    try:
        await game.execute_play_card(
            player=player,
            card_index=request.card_index,
            action_details=request.action_details
        )

        await manager.broadcast(json.dumps({"event": "update"}), game_id)

        return {"message": "Action successful."}
    except (ValueError, IndexError) as e:
        if "Your time is up" in str(e):
            print(f"Broadcasting update for game {game_id} due to an active timeout during play.")
            await manager.broadcast(json.dumps({"event": "update"}), game_id)

        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{game_id}/start")
async def start_game(game_id: str, game_manager: GameManager = Depends(get_game_manager)):
    """
    Starts the game and deals the initial hand of cards.
    """
    game = game_manager.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    try:
        game.start_game_and_deal_cards()
        await manager.broadcast(json.dumps({"event": "update"}), game_id)
        return {"message": "Game started and cards dealt successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{game_id}/vote_kick")
async def vote_kick_player(game_id: str, request: VoteKickRequest, game_manager: GameManager = Depends(get_game_manager)):
    game = game_manager.get_game(game_id)
    voter = game.get_player_by_uuid(request.voter_uuid)
    player_to_kick = game.get_player_by_number(request.player_to_kick_number)

    if not game or not voter or not player_to_kick:
        raise HTTPException(status_code=404, detail="Game or player not found.")

    try:
        player_was_kicked = game.register_kick_vote(voter, player_to_kick.uuid)
        if player_was_kicked:
            await manager.broadcast(json.dumps({"event": "player_kicked", "kicked_player_uuid": player_to_kick.uuid}),
                                    game_id)
            await manager.broadcast(json.dumps({"event": "update"}), game_id)

        return {"message": "Vote registered."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/card_types", tags=["Game"])
def get_all_card_types():
    """
    Returns a list of all unique, imitable card types in the game.
    """
    card_types = [
        StandardCard(2).to_json(),
        StandardCard(3).to_json(),
        StandardCard(5).to_json(),
        StandardCard(6).to_json(),
        StandardCard(8).to_json(),
        StandardCard(9).to_json(),
        StandardCard(10).to_json(),
        StandardCard(12).to_json(),
        FlexCard().to_json(),
        SwapCard().to_json(),
        InfernoCard().to_json(),
        StartCard(name="13/Start", move_values=[13], description="Move a cat from the start area or move 13 fields forward.").to_json(),
        StartCard(name="1/11/Start", move_values=[1, 11], description="Move a cat from the start area or move 1 or 11 fields forward.").to_json()
    ]
    return card_types