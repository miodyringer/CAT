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
    def filter(self, record):
        if not hasattr(record, 'game_id'):
            record.game_id = 'System' # Standardwert für systemweite Logs
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
    logging.info("Application started... start Timer-Background-Task.")
    task = asyncio.create_task(run_game_timer_checks())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

async def run_game_timer_checks():
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
    base_url = os.getenv("API_BASE_URL", "http://127.0.0.1:7777")

    ws_url = base_url.replace("http", "ws")
    return JSONResponse({
        "apiBaseUrl": base_url,
        "webSocketUrl": ws_url
    })

@app.get("/favicon.ico", response_class=FileResponse)
async def get_favicon():
    return FileResponse(os.path.join(ICON_DIR, "favicon.ico"), media_type="image/x-icon")

@app.get("/about", response_class=HTMLResponse)
async def get_about():
    with open(os.path.join(PAGES_DIR, "about.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/create_lobby", response_class=HTMLResponse)
async def get_create_lobby():
    with open(os.path.join(PAGES_DIR, "create_lobby.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/game", response_class=HTMLResponse)
async def get_game():
    with open(os.path.join(PAGES_DIR, "game.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/join_lobby", response_class=HTMLResponse)
async def get_join_lobby():
    with open(os.path.join(PAGES_DIR, "join_lobby.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/", response_class=HTMLResponse)
async def get_menu():
    with open(os.path.join(PAGES_DIR, "menu.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/online", response_class=HTMLResponse)
async def get_online():
    with open(os.path.join(PAGES_DIR, "online.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/rules", response_class=HTMLResponse)
async def get_rules():
    with open(os.path.join(PAGES_DIR, "rules.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/settings", response_class=HTMLResponse)
async def get_settings():
    with open(os.path.join(PAGES_DIR, "settings.html"), "r", encoding="utf-8") as f:
        html = f.read()
    return html

load_dotenv()
if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", 7777))
    uvicorn.run(app, host=host, port=port)