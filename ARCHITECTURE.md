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

* **`API/`**: This is the core of our server's communication layer, built on FastAPI.
    * **`routers/`**: Defines the API endpoints using FastAPI's `APIRouter`. `lobby.py` handles creating and joining games, while `game.py` manages in-game actions.
    * **`connection_manager.py`**: A dedicated class that leverages FastAPI's WebSocket support to manage persistent, real-time connections to all clients.
    * **`schemas.py`**: Defines the data structures for API communication using Pydantic models. This ensures that all data exchanged between the client and server is validated and consistent.
    * **`dependencies.py`**: Implements FastAPI's dependency injection system to provide reusable logic, such as retrieving the `game_manager` instance for use in different path operations.
    * **`pages_connection_api.py`**: Handles the main WebSocket endpoint and orchestrates the incoming and outgoing messages between clients and the game logic.

* **`classes/`**: Contains the core data models of the game as Python classes.
    * **`game.py`**: Defines the `Game` class, which encapsulates the entire state of a single match, including the board, players, and deck.
    * **`player.py`**, **`figure.py`**, **`deck.py`**, **`cards.py`**: These classes model the fundamental elements of the game.
    * **`enums.py`**: Holds enumerations for fixed player colors which improves code readability and maintainability.

* **`manager/`**: Orchestrates high-level application logic.
    * **`game_manager.py`**: A crucial singleton class that manages all active games and lobbies. It is responsible for creating new game instances and handling player assignments.

* **`config.py`**: Stores and exposes configuration settings for the backend, likely loaded from environment variables.

---

## 🎨 Frontend Responsibilities

The **Frontend** is the user-facing interface that runs in the browser. It is built with standard **HTML, CSS, and JavaScript**, and is responsible for rendering the game and communicating with the backend.

* **`pages/`**: Contains all the HTML files that structure the different views of the application, such as `menu.html`, `join_lobby.html`, and the main `game.html`.

* **`stylesheets/`**: Holds all CSS files for styling the application. `base.css` defines global styles, while specific files like `game.css` or `menu.css` style their respective pages.

* **`scripts/`**: Contains the client-side JavaScript logic that makes the game interactive.
    * **`services/`**: This directory is a key architectural pattern, abstracting away all API communication. `game_service.js`, `lobby_service.js`, and `player_service.js` interact with the WebSocket connection managed by `server_service.js` to communicate with the backend.
    * **UI & Game Logic**: `game_board.js` and `game_ui.js` manage the rendering and user interactions on the main game page, such as drawing the board and handling clicks. Other scripts like `create_lobby.js` and `join_lobby.js` handle the logic for their corresponding HTML pages.
    * **`audio_manager.mjs`**: Manages the playback of sound effects and music.
    * **`translator.mjs`** & **`translations.mjs`**: Handle the internationalization (i18n) of the application, allowing for multiple languages.
    * **`functions.mjs`**: Contains reusable utility functions used across different parts of the frontend code.

* **`audio/`** & **`icon/`**: These folders store static assets like sound files and the website's favicon.

---

### Root-Level Files

* **`.env`**: An environment file to store secrets and configuration variables (e.g., API keys, host settings) that should not be committed to version control.
* **`requirements.txt`**: Lists all the Python dependencies required to run the backend (e.g., `fastapi`, `uvicorn`).
* **`deploy.sh`**: A shell script to automate the deployment of the application to a server.
* **`README.md`**: The main project documentation, providing an overview of the game and its contributors.