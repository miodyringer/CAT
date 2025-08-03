# 📜 CAT - The Game

CAT is a strategic digital board game based on the classic German game "Dog". In this competitive race, each player must cleverly use a hand of cards to move their team of cats from their starting base, around the entire board, and into the safety of their finishing zone.

The game is not just about moving forward; success depends on managing a hand of cards with unique abilities. Players can use special cards to swap places with opponents, burn enemy cats off the board, or even move backward to gain a tactical advantage. Planning your moves, blocking opponents, and knowing when to play the right card are key to victory.

---
## 🕹 API Endpoint Summary

| Endpoint                                            | Method | Category | Description                                                           | Request (Parameters / Body)                                                              | Successful Response (200 OK)                                                                                                                                                                                                                                                                                                                                                                                              |
|:----------------------------------------------------|:-------|:---------|:----------------------------------------------------------------------|:-----------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/lobby/create`                        | `POST`  | Lobby    | Creates a new game lobby and adds the host player.                       | **Body:**<br>- `lobby_name` (string)<br>- `player_input`: (object, see below)                                    | **Message, new game ID, and host player ID (dict)**                                                                                                                                                                                                       |
| `/lobby/{game_id}/join`              | `POST`  | Lobby    | Adds a new player to an existing game lobby.               | **Path Parameter:**<br>- `game_id` (string)<br>**Body:**<br>- `player_input` (object, see below)                                              | **Message, game ID, and new player ID (dict)**                                                                                                                                                                           |
| `/lobby/list`                            | `GET`   | Lobby    | Lists all currently active game lobbies.                              | *None*                                                                                   | **A dictionary of all active games/lobbies (dict)**                                                                                                            |
| `/game/{game_id}/state`               | `GET`   | Game     | Retrieves the current state of a specific game.            | **Path Parameter:**<br>- `game_id` (string)<br>**Query Parameter:**<br>- `player_id` (string)                                               | **The game state from the player's perspective (dict)**                                                                                                                                                       |
| `/game/{game_id}/play`                | `POST`  | Game     | Handles a player's action to play a card.                     | **Path Parameter:**<br>- `game_id` (string)<br>**Body:**<br>- `player_uuid` (string)<br>- `card_index` (integer)<br>- `action_details` (object)                 | **Success message (dict)** |
| `/game/{game_id}/start`               | `POST`  | Game     | Starts the game and deals the initial hand of cards. | **Path Parameter:**<br>- `game_id` (string) |  **Success message (dict)** |
| `/game/{game_id}/vote_kick`         | `POST`  | Game     | Handles a player's vote to kick another player from the game.                       | **Path Parameter:**<br>- `game_id` (string)<br>**Body:**<br>- `voter_uuid` (string)<br>- `player_to_kick_number` (integer)                             | **Success message (dict)**                           |
| `/game/card_types`                    | `GET`   | Game     | Lists all unique, imitable card types in the game. | *None* | **List of dictionaries representing the card types (list)**|
| `/config`                              | `GET`   | Config   | Returns API base URL and WebSocket URL.  | *None*  | **`apiBaseUrl` (string), `webSocketUrl` (string) (dict)** |
| `/favicon.ico`                         | `GET`   | General  | Returns the favicon.ico file.  | *None*  | **favicon.ico (File)** |
| `/about`                               | `GET`   | General  | Returns the 'about' HTML page.   | *None*  | **HTML content (string)**|
| `/create_lobby`                        | `GET`   | General  | Returns the 'create_lobby' HTML page. | *None*  | **HTML content (string)**|
| `/game`                                 | `GET`   | General  | Returns the 'game' HTML page. | *None*  | **HTML content (string)**|
| `/join_lobby`                          | `GET`   | General  | Returns the 'join_lobby' HTML page. | *None*  | **HTML content (string)**|
| `/`                                    | `GET`   | General  | Returns the main menu HTML page. | *None*  | **HTML content (string)**|
| `/online`                              | `GET`   | General  | Returns the 'online' HTML page. | *None*  | **HTML content (string)**|
| `/rules`                               | `GET`   | General  | Returns the 'rules' HTML page. | *None*  | **HTML content (string)**|
| `/settings`                            | `GET`   | General  | Returns the 'settings' HTML page. | *None*  | **HTML content (string)**|

---

## 📃 Example Response

```json
{
    "uuid": "aa0780e5-7e46-4519-a006-1725390ce784",
    "name": "1",
    "players": [
        {
            "uuid": "d094fab4-6466-4c8e-acdf-bc97f90483cc",
            "name": "1",
            "number": 0,
            "color": "green",
            "cards": [
                {
                    "name": "1/11/Start",
                    "description": "Move a cat from the start area or move 1 or 11 fields forward.",
                    "type": "StartCard",
                    "move_values": [
                        1,
                        11
                    ]
                },
                {
                    "name": "8",
                    "description": "Move your figure 8 fields forward.",
                    "value": 8,
                    "type": "StandardCard"
                },
                {
                    "name": "5",
                    "description": "Move your figure 5 fields forward.",
                    "value": 5,
                    "type": "StandardCard"
                },
                {
                    "name": "Flex Card",
                    "description": "Choose to move either forward or backward by 4.",
                    "type": "FlexCard"
                },
                {
                    "name": "6",
                    "description": "Move your figure 6 fields forward.",
                    "value": 6,
                    "type": "StandardCard"
                },
                {
                    "name": "6",
                    "description": "Move your figure 6 fields forward.",
                    "value": 6,
                    "type": "StandardCard"
                }
            ],
            "figures": [
                {
                    "uuid": "5bdef79e-fa26-45a4-90cd-8c99cd5ed88e",
                    "color": "green",
                    "position": -1
                },
                {
                    "uuid": "d5726a63-1686-4323-92b6-2e7194e62d94",
                    "color": "green",
                    "position": -1
                },
                {
                    "uuid": "8b361075-af76-4818-880d-22014797e756",
                    "color": "green",
                    "position": 15
                },
                {
                    "uuid": "a7be0216-0b77-41d6-80bb-19f436f9ef9f",
                    "color": "green",
                    "position": 9
                }
            ],
            "is_active": true
        },
        {
            "uuid": null,
            "name": "2",
            "number": 1,
            "color": "pink",
            "cards": 6,
            "figures": [
                {
                    "uuid": "569049b1-58cb-48d6-b3ec-026b1496ebaa",
                    "color": "pink",
                    "position": -1
                },
                {
                    "uuid": "8c19f7cd-e9fd-481e-ac53-7426767d250f",
                    "color": "pink",
                    "position": 26
                },
                {
                    "uuid": "b26d0738-7d98-4a02-bdb8-6b07a4a347f2",
                    "color": "pink",
                    "position": -1
                },
                {
                    "uuid": "d1ac8eba-65ba-408b-ad34-ddfad528a9c6",
                    "color": "pink",
                    "position": -1
                }
            ],
            "is_active": true
        }
    ],
    "host_id": "d094fab4-6466-4c8e-acdf-bc97f90483cc",
    "number_of_players": 2,
    "field_occupation": {
        "9": {
            "uuid": "a7be0216-0b77-41d6-80bb-19f436f9ef9f",
            "color": "green",
            "position": 9
        },
        "15": {
            "uuid": "8b361075-af76-4818-880d-22014797e756",
            "color": "green",
            "position": 15
        },
        "26": {
            "uuid": "8c19f7cd-e9fd-481e-ac53-7426767d250f",
            "color": "pink",
            "position": 26
        }
    },
    "game_over": false,
    "current_player_index": 1,
    "round_number": 6,
    "game_started": true,
    "last_played_card": {
        "name": "9",
        "description": "Move your figure 9 fields forward.",
        "value": 9,
        "type": "StandardCard"
    },
    "remaining_turn_time": 20,
    "turn_duration": 20
}
```

---
## 📡 WebSocket

The WebSocket just sends an update broadcast to all players in the game when the game state changes. Then the player asks for an update from the API to get the current game state.

---

## ✨ Contributors

This project was brought to life by the collaborative efforts of:

*   Alexia Adams
*   Vincent Brück
*   Finn Renzenbrink
*   Emilio Dyringer

---


## 🤖 Use of AI 

The background music for the game was generated using **suno AI**. 
Code comments and documentation were enhanced with the help of **Gemini**. Also it helped to validate code logic and improve the overall code quality.


---


## 🧑‍💻 Division of tasks
Finn Renzenbrink was responsible for the backend development, while Emilio Dyringer focused on the frontend implementation. Vincent Brück made logo designs, translations, and the game rules. 


---


## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

* Python 3.12+
* An active Python virtual environment is highly recommended.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [URL-zum-Repository]
    cd [Projektordner]
    ```

2.  **Set up the Python Backend:**
    * Create and activate a virtual environment:
        ```sh
        python -m venv venv
        source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
        ```
    * Install the required dependencies from `requirements.txt`:
        ```sh
        pip install -r requirements.txt
        ```

### Configuration

The server is configured using an `.env` file in the root directory of the project.

1.  Create a file named `.env` in the project root.
2.  Add the following content to the file. This will configure the server to run locally.

    ```env
    # .env
    API_HOST=127.0.0.1
    API_PORT=8500

    API_BASE_URL=http://127.0.0.1:8500
    ```

### Running the Application

1.  **Start the Server:**
    Run the following command from the project's root directory to start the FastAPI server:
    ```sh
    uvicorn CAT.Backend.API.pages_connection_api:app --reload --host 0.0.0.0 --port 8500
    ```
    * `--reload` automatically restarts the server when you make changes to the code.

2.  **Access the Game:**
    Open your web browser and navigate to the following address:
    ```
    [http://127.0.0.1:8500]
    ```

You should now see the game's main menu and be able to start playing!
