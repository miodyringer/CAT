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
    "1/6", "1/7", "1/8", "1/9", "1/10", "2/10", "3/10", "4/10", "5/10", "6/10", "6/11", "6/12", "6/13", "6/14",
    "6/15", "7/15", "8/15", "9/15", "10/15", "10/14", "10/13", "10/12", "10/11", "10/10", "11/10", "12/10", "13/10", "14/10",
    "15/10", "15/9", "15/8", "15/7", "15/6", "14/6", "13/6", "12/6", "11/6", "10/6", "10/5", "10/4", "10/3", "10/2",
    "10/1", "9/1", "8/1", "7/1", "6/1", "6/2", "6/3", "6/4", "6/5", "6/6", "5/6", "4/6", "3/6", "2/6",
];
const HOME_COORDINATES = {
    "green": ["2/2", "3/2", "2/3", "3/3"],
    "pink": ["2/13", "2/14", "3/13", "3/14"],
    "blue": ["13/2", "14/2", "13/3", "14/3"],
    "orange": ["13/13", "14/13", "13/14", "14/14"],
};
const FINISH_COORDINATES = {
    "green": ["2/7", "3/7", "4/7", "5/7"],
    "pink": ["7/14", "7/13", "7/12", "7/11"],
    "blue": ["9/2", "9/3", "9/4", "9/5"],
    "orange": ["14/9", "13/9", "12/9", "11/9"],
};


export function renderFigures() {
    document.querySelectorAll(".figure").forEach(fig => fig.remove());

    const localPlayer = gameService.getLocalPlayer();
    const players = gameService.getPlayers();
    if (!players || !localPlayer) return;

    let selectedCard = gameService.getHand()[gameService.getSelectedCardIndex()];

    // --- KORREKTUR FÜR SWAP UND INFERNO ---
    let isSwapActive = false;
    let isInfernoActive = false;

    if (selectedCard) {
        let activeCard = selectedCard;
        // Wenn ein Joker gespielt wird, nutze die imitierte Karte für die Logik
        if (selectedCard.type === 'JokerCard') {
            const jokerImitation = gameService.getJokerImitation();
            if (jokerImitation) {
                activeCard = jokerImitation;
            }
        }

        if (activeCard.type === 'SwapCard') {
            isSwapActive = true;
        }
        if (activeCard.type === 'InfernoCard') {
            isInfernoActive = true;
        }
    }

    const previouslyHighlighted = document.querySelector('.tile.highlighted');
    if (previouslyHighlighted) {
        previouslyHighlighted.classList.remove('highlighted');
    }

    const previouslyTargetHighlighted = document.querySelector('.tile.target-highlighted');
    if (previouslyTargetHighlighted) {
        previouslyTargetHighlighted.classList.remove('target-highlighted');
    }

    players.forEach(player => {
        player.figures.forEach((figure, index) => {
            const figureElement = document.createElement("div");
            figureElement.className = `figure ${figure.color}`;
            figureElement.id = figure.uuid;

            let gridPosition = "";
            if (figure.position === -1) {
                gridPosition = HOME_COORDINATES[figure.color][index];
            } else if (figure.position >= 100) {
                const finishIndex = figure.position % 100;
                gridPosition = FINISH_COORDINATES[figure.color][finishIndex];
            } else {
                gridPosition = PATH_COORDINATES[figure.position];
            }
            figureElement.style.gridArea = gridPosition;

            figureElement.innerHTML = `<div class="body"></div><div class="ears"></div><div class="head"></div>`;

            const isOwn = player.uuid === localPlayer.uuid;
            const isClickable = (isOwn && gameService.isLocalPlayerTurn()) || (isSwapActive && figure.position >= 0);

            if (isClickable) {
                figureElement.classList.add("own-figure");
                figureElement.addEventListener('click', () => {
                    gameService.selectFigure(figure.uuid);
                    document.dispatchEvent(new Event('selectionChanged'));
                });
            }
            if (figure.uuid === gameService.getSelectedFigureId()) {
                figureElement.classList.add("selected");
                const figureGridArea = figureElement.style.gridArea;
                const figureTile = document.querySelector(`.tile[style*="grid-area: ${figureGridArea}"]`);
                if (figureTile) {
                    figureTile.classList.add('highlighted');
                }
            }
            if (figure.uuid === gameService.getSelectedTargetFigureId()) {
                figureElement.classList.add("target-selection");
                const targetGridArea = figureElement.style.gridArea;
                const targetTile = document.querySelector(`.tile[style*="grid-area: ${targetGridArea}"]`);
                if (targetTile) {
                    targetTile.classList.add('target-highlighted');
                }
            }

            if (isInfernoActive && isOwn && figure.position !== -1) {
                const controls = document.createElement('div');
                controls.className = 'figure-step-controls';

                const minusBtn = document.createElement('button');
                minusBtn.className = 'step-button';
                minusBtn.textContent = '-';
                minusBtn.onclick = (e) => {
                    e.stopPropagation();
                    let steps = gameService.getStepsForFigure(figure.uuid);
                    if (steps > 0) {
                        gameService.updateInfernoMove(figure.uuid, steps - 1);
                        document.dispatchEvent(new Event('selectionChanged'));
                    }
                };

                const plusBtn = document.createElement('button');
                plusBtn.className = 'step-button';
                plusBtn.textContent = '+';
                plusBtn.onclick = (e) => {
                    e.stopPropagation();
                    let pointsLeft = gameService.getInfernoPointsRemaining();
                    if (pointsLeft > 0) {
                        let steps = gameService.getStepsForFigure(figure.uuid);
                        gameService.updateInfernoMove(figure.uuid, steps + 1);
                        document.dispatchEvent(new Event('selectionChanged'));
                    }
                };

                const stepsDisplay = document.createElement('span');
                stepsDisplay.textContent = gameService.getStepsForFigure(figure.uuid);

                controls.appendChild(minusBtn);
                controls.appendChild(stepsDisplay);
                controls.appendChild(plusBtn);
                figureElement.appendChild(controls);
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