import gameService from "./services/game_service.js";

const boardElement = document.querySelector("#board");
const sideLength = 15;

const board = [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 3, 0, 0, 0, 0, 0,
    0, 2, 2, 0, 0, 1, 0, 0, 3, 1, 0, 0, 3, 3, 0,
    0, 2, 2, 0, 0, 1, 0, 0, 3, 1, 0, 0, 3, 3, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 3, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 3, 1, 0, 0, 0, 0, 0,
    2, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1,
    1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 1,
    1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 5,
    0, 0, 0, 0, 0, 1, 4, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 4, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 4, 4, 0, 0, 1, 4, 0, 0, 1, 0, 0, 5, 5, 0,
    0, 4, 4, 0, 0, 1, 4, 0, 0, 1, 0, 0, 5, 5, 0,
    0, 0, 0, 0, 0, 4, 1, 1, 1, 1, 0, 0, 0, 0, 0
];

function renderBoardTiles() {
    for (let i = 0; i < board.length; i++) {
        const row = i % sideLength + 1;
        const col = Math.floor(i / sideLength) + 1;
        if (board[i] !== 0) {
            const tile = document.createElement("div");
            if (board[i] === 1) { tile.className = "tile path"; }
            if (board[i] === 2) { tile.className = "tile green"; }
            if (board[i] === 3) { tile.className = "tile blue"; }
            if (board[i] === 4) { tile.className = "tile pink"; }
            if (board[i] === 5) { tile.className = "tile orange"; }
            tile.style.gridArea = `${row} / ${col}`;
            const cube = document.createElement("div");
            cube.className = "cube";
            cube.innerHTML = `<div class="side top"></div><div class="side bottom"></div><div class="side frontl"></div><div class="side frontr"></div><div class="side backl"></div><div class="side backr"></div>`;
            tile.appendChild(cube);
            boardElement.appendChild(tile);
        }
    }
}

const PATH_COORDINATES = [
    "6/2", "6/3", "6/4", "6/5", "5/6", "4/6", "3/6", "2/6", "1/6", "1/7", "1/8", "1/9", "1/10", "2/10", "3/10", "4/10", "5/10", "6/11", "6/12", "6/13", "6/14", "6/15", "7/15", "8/15", "9/15", "10/15", "10/14", "10/13", "10/12", "10/11", "11/10", "12/10", "13/10", "14/10", "15/10", "15/9", "15/8", "15/7", "15/6", "14/6", "13/6", "12/6", "11/6", "10/5", "10/4", "10/3", "10/2", "10/1", "9/1", "8/1", "7/1", "6/1", "6/1", "6/1"
];
const HOME_COORDINATES = {
    "green": ["2/2", "3/2", "2/3", "3/3"],
    "pink": ["2/13", "2/14", "3/13", "3/14"],
    "blue": ["13/2", "14/2", "13/3", "14/3"],
    "orange": ["13/13", "14/13", "13/14", "14/14"],
};
const FINISH_COORDINATES = {
    "green": ["7/2", "7/3", "7/4", "7/5"],
    "pink": ["2/9", "3/9", "4/9", "5/9"],
    "blue": ["9/2", "9/3", "9/4", "9/5"],
    "orange": ["14/9", "13/9", "12/9", "11/9"],
};


export function renderFigures() {
    document.querySelectorAll(".figure").forEach(fig => fig.remove());

    const localPlayer = gameService.getLocalPlayer();
    const players = gameService.getPlayers();
    if (!players || !localPlayer) return;

    players.forEach(player => {
        player.figures.forEach((figure, index) => {
            const figureElement = document.createElement("div");
            figureElement.className = `figure ${figure.color}`;
            figureElement.id = figure.uuid;

            // calculate position in the grid based on the figure's position
            let gridPosition = "";
            if (figure.position === -1) { // home position
                gridPosition = HOME_COORDINATES[figure.color][index];
            } else if (figure.position >= 100) { // finish position
                const finishIndex = figure.position % 100;
                gridPosition = FINISH_COORDINATES[figure.color][finishIndex];
            } else { // path position
                gridPosition = PATH_COORDINATES[figure.position];
            }
            figureElement.style.gridArea = gridPosition;

            // add the figure
            figureElement.innerHTML = `<div class="body"></div><div class="ears"></div><div class="head"></div>`;

            // only make the figure clickable if it's the local player's figure
            if (player.uuid === localPlayer.uuid) {
                figureElement.classList.add("own-figure");
                if (gameService.isLocalPlayerTurn()) {
                    figureElement.addEventListener('click', () => {
                        gameService.selectFigure(figure.uuid);
                        document.dispatchEvent(new Event('selectionChanged'));
                    });
                }
            }

            if (figure.uuid === gameService.getSelectedFigureId()) {
                figureElement.classList.add("selected");
            }

            boardElement.appendChild(figureElement);
        });
    });
}

renderBoardTiles();


const cameraContainer = document.querySelector("#camera-container");

let scale = 1.0;
let panX = 0;
let panY = 64;

function updateBoardTransform() {
    const centering = "translateX(-50%) translateY(-50%)";
    const rotation = "rotateX(55deg) rotateZ(45deg)";

    const panning = `translate3d(${panX}px, ${panY}px, 0)`;
    const zooming = `scale(${scale})`;

    boardElement.style.transform = `${centering} ${zooming} ${panning} ${rotation}`;
}

updateBoardTransform();

document.addEventListener('keydown', (e) => {
    e.preventDefault();
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const moveSpeed = 20 / scale ** 1.5;

    let dx = 0, dy = 0;
    let zoomIn = false, zoomOut = false;

    switch (e.code) {
        case "BracketRight": case "KeyP": if (scale < 2.0) { scale = Math.min(2.0, scale + 0.1); zoomIn = true } break;
        case "Slash": case "KeyM": if (scale > 0.5) { scale = Math.max(0.5, scale - 0.1); zoomOut = true } break;
        case "ArrowUp": case "KeyW": dy = -moveSpeed; break;
        case "ArrowDown": case "KeyS": dy = moveSpeed; break;
        case "ArrowLeft": case "KeyA": dx = -moveSpeed; break;
        case "ArrowRight": case "KeyD": dx = moveSpeed; break;
        case "KeyR":
            scale = 1.0; panX = 0; panY = 64;
            updateBoardTransform();
            return;
    }
    if (isPortrait) {
        panX -= dx;
        panY -= dy;
    } else {
        panX += dx;
        panY += dy;
    }
    if (dx !== 0 || dy !== 0 || zoomIn || zoomOut) {
        updateBoardTransform();
    }
});

document.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (e.deltaY < 0 && scale < 2.0) {
        scale = Math.min(2.0, scale + 0.1);
    } else if (e.deltaY > 0 && scale > 0.5) {
        scale = Math.max(0.5, scale - 0.1);
    }

    updateBoardTransform();

}, { passive: false });

const panState = { isPanning: false, lastX: 0, lastY: 0 };

cameraContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    panState.isPanning = true;
    panState.lastX = e.clientX;
    panState.lastY = e.clientY;
});

cameraContainer.addEventListener('mousemove', (e) => {
    if (!panState.isPanning) return;
    e.preventDefault();
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    const dx = e.clientX - panState.lastX;
    const dy = e.clientY - panState.lastY;

    panState.lastX = e.clientX;
    panState.lastY = e.clientY;

    if (isPortrait) {
        panX -= dy / scale;
        panY += dx / scale;
    } else {
        panX += dx / scale;
        panY += dy / scale;
    }
    updateBoardTransform();
});

const stopPanning = () => { if (panState.isPanning) panState.isPanning = false; };
window.addEventListener('mouseup', stopPanning);
cameraContainer.addEventListener('mouseleave', stopPanning);