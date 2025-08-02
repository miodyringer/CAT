from pydantic import BaseModel
from typing import Optional, Any, Dict

class PlayerInput(BaseModel):
    player_name: str

class CreateLobbyRequest(BaseModel):
    lobby_name: str
    player_input: PlayerInput

class PlayCardRequest(BaseModel):
    player_uuid: str
    card_index: int
    action_details: Dict[str, Any]

class VoteKickRequest(BaseModel):
    voter_uuid: str
    player_to_kick_number: int