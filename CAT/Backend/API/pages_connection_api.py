import asyncio
import json
import time
import uvicorn
import os
import logging
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from CAT.Backend.API.routers import lobby, game
from CAT.Backend.API.dependencies import get_game_manager
from CAT.Backend.API.connection_manager import manager
from CAT.Backend.config import GAME_INACTIVITY_TIMEOUT, FINISHED_GAME_CLEANUP_DELAY


class GameIdFilter(logging.Filter):
    """
    Logging filter that ensures every log record has a 'game_id' attribute.

    If the log record does not already have a 'game_id', it sets it to 'System' as a default value.
    This helps to distinguish between system-wide logs and game-specific logs.
    """
    def filter(self, record):
        """
        Checks and sets the 'game_id' attribute for a log record.

        Args:
            record (logging.LogRecord): The log record to filter.

        Returns:
            bool: Always True to allow the log record to be processed.
        """
        if not hasattr(record, 'game_id'):
            record.game_id = 'System' # Default value for system-wide logs
        return True

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(game_id)s] - %(message)s'
)

logging.getLogger().addFilter(GameIdFilter())


CURRENT_FILE_PATH = Path(__file__).resolve()
API_DIR = CURRENT_FILE_PATH.parent
BASE_DIR = API_DIR.parent.parent
PAGES_DIR = BASE_DIR / "Frontend" / "pages"
STYLESHEETS_DIR = BASE_DIR / "Frontend" / "stylesheets"
SCRIPTS_DIR = BASE_DIR / "Frontend" / "scripts"
AUDIO_DIR = BASE_DIR / "Frontend" / "audio"
ICON_DIR = BASE_DIR / "Frontend" / "icon"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager that starts and stops the background game timer task.

    Args:
        app (FastAPI): The FastAPI application instance.

    Yields:
        None
    """
    logging.info("Application started... start Timer-Background-Task.")
    task = asyncio.create_task(run_game_timer_checks())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

async def run_game_timer_checks():
    """
    Periodically checks all games for timeouts and performs cleanup of inactive or finished games.

    This function runs in the background and:
      - Calls check_timeout_and_broadcast on each game every second.
      - Closes and removes games that are inactive for too long.
      - Cleans up finished games after a delay.
    """
    game_manager = get_game_manager()

    while True:
        await asyncio.sleep(1)
        for game_id, game in list(game_manager.games.items()):
            await game.check_timeout_and_broadcast()
            if time.time() - game.last_activity_time > GAME_INACTIVITY_TIMEOUT:
                logging.info(f"Closing inactive game {game_id} due to inactivity.")
                await manager.broadcast(json.dumps({"event": "game_closed", "reason": "Inactivity"}), game_id)
                del game_manager.games[game_id]

            if game.game_over and game.game_over_time:
                if time.time() - game.game_over_time > FINISHED_GAME_CLEANUP_DELAY:
                    logging.info(f"Cleaning up finished game {game_id}.")
                    await manager.broadcast(json.dumps({"event": "game_closed", "reason": "Game finished"}), game_id)
                    del game_manager.games[game_id]


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API routers
app.include_router(lobby.router)
app.include_router(game.router)

# Mount static directories for CSS and JavaScript files
app.mount("/stylesheets", StaticFiles(directory=STYLESHEETS_DIR), name="stylesheets")
app.mount("/scripts", StaticFiles(directory=SCRIPTS_DIR), name="scripts")
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")
app.mount("/icon", StaticFiles(directory=ICON_DIR), name="icon")

@app.get("/config")
async def get_config():
    """
    Returns the API base URL and WebSocket URL for the frontend to use.

    Returns:
        JSONResponse: Contains 'apiBaseUrl' and 'webSocketUrl' for client configuration.
    """
    base_url = os.getenv("API_BASE_URL", "http://127.0.0.1:7777")
    ws_url = base_url.replace("http", "ws")
    return JSONResponse({
        "apiBaseUrl": base_url,
        "webSocketUrl": ws_url
    })

@app.get("/favicon.ico", response_class=FileResponse)
async def get_favicon():
    """
    Returns the favicon.ico file for the application.

    Returns:
        FileResponse: The favicon.ico file with the correct media type.
    """
    return FileResponse(os.path.join(ICON_DIR, "favicon.ico"), media_type="image/x-icon")

@app.get("/about", response_class=HTMLResponse)
async def get_about():
    """
    Returns the 'about' HTML page.

    Returns:
        str: The HTML content of the about page.
    """
    with open(os.path.join(PAGES_DIR, "about.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/create_lobby", response_class=HTMLResponse)
async def get_create_lobby():
    """
    Returns the 'create_lobby' HTML page.

    Returns:
        str: The HTML content of the create_lobby page.
    """
    with open(os.path.join(PAGES_DIR, "create_lobby.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/game", response_class=HTMLResponse)
async def get_game():
    """
    Returns the 'game' HTML page.

    Returns:
        str: The HTML content of the game page.
    """
    with open(os.path.join(PAGES_DIR, "game.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/join_lobby", response_class=HTMLResponse)
async def get_join_lobby():
    """
    Returns the 'join_lobby' HTML page.

    Returns:
        str: The HTML content of the join_lobby page.
    """
    with open(os.path.join(PAGES_DIR, "join_lobby.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/", response_class=HTMLResponse)
async def get_menu():
    """
    Returns the main menu HTML page.

    Returns:
        str: The HTML content of the menu page.
    """
    with open(os.path.join(PAGES_DIR, "menu.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/online", response_class=HTMLResponse)
async def get_online():
    """
    Returns the 'online' HTML page.

    Returns:
        str: The HTML content of the online page.
    """
    with open(os.path.join(PAGES_DIR, "online.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/rules", response_class=HTMLResponse)
async def get_rules():
    """
    Returns the 'rules' HTML page.

    Returns:
        str: The HTML content of the rules page.
    """
    with open(os.path.join(PAGES_DIR, "rules.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/settings", response_class=HTMLResponse)
async def get_settings():
    """
    Returns the 'settings' HTML page.

    Returns:
        str: The HTML content of the settings page.
    """
    with open(os.path.join(PAGES_DIR, "settings.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

load_dotenv()
if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", 7777))
    uvicorn.run(app, host=host, port=port)