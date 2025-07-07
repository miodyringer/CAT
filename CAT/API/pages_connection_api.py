from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parent.parent
app = FastAPI()

app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=[""],
        allow_headers=[""],
    )

# Statische Verzeichnisse einbinden
app.mount("/stylesheets", StaticFiles(directory=PROJECT_ROOT / "stylesheets"), name="stylesheets")
app.mount("/scripts", StaticFiles(directory=PROJECT_ROOT / "scripts"), name="scripts")


@app.get("/about", response_class=HTMLResponse)
async def get_about():
    with open(f"{PROJECT_ROOT}/pages/about.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/create_lobby", response_class=HTMLResponse)
async def get_create_lobby():
    with open(f"{PROJECT_ROOT}/pages/create_lobby.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/game", response_class=HTMLResponse)
async def get_game():
    with open(f"{PROJECT_ROOT}/pages/game.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/join_lobby", response_class=HTMLResponse)
async def get_join_lobby():
    with open(f"{PROJECT_ROOT}/pages/join_lobby.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/", response_class=HTMLResponse)
async def get_menu():
    with open(""
              f"{PROJECT_ROOT}/pages/menu.html", "r", encoding="utf-8") as f:
            html = f.read()
    return html


@app.get("/online", response_class=HTMLResponse)
async def get_online():
    with open(f"{PROJECT_ROOT}/pages/online.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/rules", response_class=HTMLResponse)
async def get_rules():
    with open(f"{PROJECT_ROOT}/pages/rules.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

@app.get("/settings", response_class=HTMLResponse)
async def get_settings():
    with open(f"{PROJECT_ROOT}/pages/settings.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "CAT.API.pages_connection_api:app",
        host="0.0.0.0",
        port=8000,
        workers=1,
        reload=True
    )