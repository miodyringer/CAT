from fastapi import APIRouter, Depends, HTTPException, Query
from CAT.manager.game_manager import GameManager
from CAT.API.dependencies import get_game_manager
from CAT.API.schemas import PlayCardRequest # Import the new schema


router = APIRouter(
    prefix="/game",
    tags=["Game"],
)


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
def play_card_action(game_id: str, request: PlayCardRequest, game_manager: GameManager = Depends(get_game_manager)):
    """
    Handles a player's action to play a card.
    """
    game = game_manager.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    player = game.get_player_by_uuid(request.player_uuid)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found in this game")

    try:
        # Call the new, centralized method in the Game object
        game.execute_play_card(
            player=player,
            card_index=request.card_index,
            action_details=request.action_details
        )
        return {"message": f"Player {player.name} successfully played card at index {request.card_index}."}
    except (ValueError, IndexError) as e:
        # Catch potential errors from the game logic (e.g., invalid move)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{game_id}/start")
def start_game(game_id: str, game_manager: GameManager = Depends(get_game_manager)):
    """
    Starts the game and deals the initial hand of cards.
    """
    game = game_manager.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    try:
        game.start_game_and_deal_cards()
        return {"message": "Game started and cards dealt successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))