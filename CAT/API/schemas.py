from pydantic import BaseModel
from typing import Optional, Any, Dict

# Dieses Schema definiert, wie die Spieler-Informationen aussehen
class PlayerInput(BaseModel):
    player_name: str

# Dieses Schema bündelt die gesamte Anfrage für das Erstellen einer Lobby
class CreateLobbyRequest(BaseModel):
    lobby_name: str
    player_input: PlayerInput

# FÜGE DIESES FEHLENDE MODELL HINZU
class PlayCardRequest(BaseModel):
    player_uuid: str
    card_index: int
    action_details: Dict[str, Any]