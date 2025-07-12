from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from CAT.API.routers import lobby, game
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

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