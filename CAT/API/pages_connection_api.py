import asyncio
import json
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from CAT.API.routers import lobby, game
from fastapi.middleware.cors import CORSMiddleware
from CAT.API.dependencies import get_game_manager
from CAT.API.connection_manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application started... start Timer-Background-Task.")
    task = asyncio.create_task(run_game_timer_checks())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

async def run_game_timer_checks():
    game_manager = get_game_manager()
    GAME_INACTIVITY_TIMEOUT = 60 * 3  # 3 minutes inactivity timeout
    while True:
        await asyncio.sleep(1)
        for game_id, game in list(game_manager.games.items()):
            if game._check_and_handle_timeout():
                print(f"Broadcasting update for game {game_id} due to timeout.")
                await manager.broadcast(json.dumps({"event": "update"}), game_id)
            if time.time() - game.last_activity_time > GAME_INACTIVITY_TIMEOUT:
                print(f"Closing inactive game {game_id} due to inactivity.")
                # Informiere alle verbundenen Spieler, dass das Spiel geschlossen wird
                await manager.broadcast(json.dumps({"event": "game_closed", "reason": "Inactivity"}), game_id)
                # Entferne das Spiel aus dem Manager
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
app.mount("/stylesheets", StaticFiles(directory="CAT/stylesheets"), name="stylesheets")
app.mount("/scripts", StaticFiles(directory="CAT/scripts"), name="scripts")
app.mount("/audio", StaticFiles(directory="CAT/audio"), name="audio")

@app.get("/about", response_class=HTMLResponse)
async def get_about():
    with open("CAT/pages/about.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/create_lobby", response_class=HTMLResponse)
async def get_create_lobby():
    with open("CAT/pages/create_lobby.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/game", response_class=HTMLResponse)
async def get_game():
    with open("CAT/pages/game.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/join_lobby", response_class=HTMLResponse)
async def get_join_lobby():
    with open("CAT/pages/join_lobby.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/", response_class=HTMLResponse)
async def get_menu():
    with open("CAT/pages/menu.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/online", response_class=HTMLResponse)
async def get_online():
    with open("CAT/pages/online.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/rules", response_class=HTMLResponse)
async def get_rules():
    with open("CAT/pages/rules.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/settings", response_class=HTMLResponse)
async def get_settings():
    with open("CAT/pages/settings.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html