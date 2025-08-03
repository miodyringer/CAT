# 🏛️ Project Architecture

This document provides a detailed overview of the project's architecture, including the folder structure and the responsibilities of each component. It is designed to help developers quickly understand the codebase and the separation between the backend and frontend.

## 📁 Folder Structure

Our project follows a standard client-server model, with a clear separation between the **`Backend`** (server-side logic) and the **`Frontend`** (client-side user interface).

<pre>
/
├── 📂 CAT/
│   ├── 📂 Backend/
│   │   ├── 📂 API/
│   │   ├── 📂 classes/
│   │   ├── 📂 manager/
│   │   └── config.py
│   │
│   └── 📂 Frontend/
│       ├── 📂 audio/
│       ├── 📂 icon/
│       ├── 📂 pages/
│       ├── 📂 scripts/
│       └── 📂 stylesheets/
│
├── 📜 .env
├── 📜 README.md
├── 📜 requirements.txt
└── 📜 deploy.sh
</pre>

---

## ⚙️ Backend Responsibilities

The **Backend** is built with **Python** and the **FastAPI** framework. It is responsible for all server-side operations, managing the game state, handling client connections via WebSockets, and enforcing all game rules.

* **`pages_connection_api.py`**: This file is the **main entry point that starts the entire web application**. Its confirmed responsibilities are:
    * **Serving HTML Pages**: It defines HTTP GET routes like `@app.get("/")` to deliver the HTML files from `Frontend/pages` to the user's browser.
    * **Serving Static Files**: It mounts the frontend directories (e.g., `stylesheets`, `scripts`) as static paths, allowing the HTML files to load their assets.
    * **Integrating API Routers**: It uses `app.include_router()` to import and activate the HTTP and WebSocket endpoints defined in the `routers` directory, making them accessible to the application.

* **`API/`**: This directory contains the supporting modules for the main web server.
    * **`routers/game.py`**: This is where the **actual WebSocket endpoint is defined** with `@router.websocket("/ws/{game_id}/{player_id}")`. It handles the connection lifecycle for a single client: accepting the connection, passing it to the `ConnectionManager`, and listening for incoming messages in a loop.
    * **`routers/lobby.py`**: Defines standard **HTTP endpoints** (e.g., `@router.post("/lobby")`) for creating and managing game lobbies before a WebSocket connection is established.
    * **`connection_manager.py`**: This class acts as the **central registry for all active WebSocket connections**. It maintains a dictionary of connections per lobby and provides `connect()`, `disconnect()`, and `broadcast()` methods to manage the clients.
    * **`schemas.py`**: Defines Pydantic models (e.g., `GameRead`, `PlayerCreate`) to ensure that all data in API requests and responses is structured and validated correctly.
    * **`dependencies.py`**: Implements FastAPI's dependency injection system. The `get_game_manager()` function provides a reusable way to access the singleton `game_manager` instance within API routes.

* **`classes/`**: Contains the core data models of the game.
    * **`game.py`**, **`player.py`**, **`figure.py`**, **`deck.py`**, **`cards.py`**: These files define the fundamental Python classes that model the game's state and elements.
    * **`enums.py`**: Holds Python `Enum` classes for fixed value sets like `PlayerState` or `CardType` to ensure consistency and improve code readability.

* **`manager/`**: Orchestrates high-level application logic.
    * **`game_manager.py`**: A crucial singleton class that manages the lifecycle of all active games and lobbies, containing methods like `create_game` and `get_game`.

* **`config.py`**: Contains a `Settings` class that uses Pydantic to load configuration from environment variables, which are defined in the `.env` file.

---

## 🎨 Frontend Responsibilities

The **Frontend** is the user-facing interface that runs in the browser, built with standard **HTML, CSS, and JavaScript**.

* **`pages/`**: Contains all the HTML files that structure the different views of the application.
* **`stylesheets/`**: Holds all CSS files for styling the application.
* **`scripts/`**: Contains the client-side JavaScript logic.
    * **`services/`**: This directory abstracts away API communication. `server_service.js` is responsible for the http requests, while other services like `game_service.js` use this connection to send and receive game-specific data.
    * **UI & Game Logic**: `game_board.js` and `game_ui.js` manage rendering and user interactions on the game page. Also `game_ui.js` uses the websocket connection to receive info when the game has updated.
* **`audio/`** & **`icon/`**: These folders store static assets like sound files and the favicon.

---

### Root-Level Files

* **`.env`**: An environment file to store configuration variables that are loaded by `pages_connection_api.py` to get the right server data.
* **`requirements.txt`**: Lists all the Python dependencies required to run the backend.
* **`deploy.sh`**: A shell script to automate the deployment of the application.
* **`README.md`**: The main project documentation.