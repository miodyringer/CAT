from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    """
    Manages WebSocket connections for multiple games, allowing broadcasting and tracking of active connections.
    """
    def __init__(self):
        """
        Initializes the ConnectionManager with an empty dictionary for active connections.
        """
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, game_id: str):
        """
        Accepts a new WebSocket connection and adds it to the list of active connections for the specified game.

        Args:
            websocket (WebSocket): The WebSocket connection instance from the client.
            game_id (str): The ID of the game to associate with this connection.
        """
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)

    def disconnect(self, websocket: WebSocket, game_id: str):
        """
        Removes a WebSocket connection from the list of active connections for the specified game.

        Args:
            websocket (WebSocket): The WebSocket connection instance to remove.
            game_id (str): The ID of the game associated with this connection.
        """
        if game_id in self.active_connections:
            try:
                self.active_connections[game_id].remove(websocket)
            except ValueError:
                pass

    async def broadcast(self, message: str, game_id: str):
        """
        Sends a message to all active WebSocket connections for the specified game.

        Args:
            message (str): The message to send to all clients.
            game_id (str): The ID of the game whose clients should receive the message.
        """
        if game_id in self.active_connections:
            for connection in self.active_connections[game_id]:
                await connection.send_text(message)

manager = ConnectionManager()