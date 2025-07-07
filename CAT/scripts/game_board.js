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
]
const sideLength = 15;

const figures = {
    "pink": ["2 / 14", "3 / 14", "2 / 13", "3 / 13"],
    "green": ["2 / 2", "2 / 3", "3 / 3", "3 / 2"],
    "blue": ["14 / 2", "14 / 3", "13 / 2", "13 / 3"],
    "orange": ["13 / 13", "13 / 14", "14 / 14", "14 / 13"],
}

const boardElement = document.querySelector("#board");

for (let i = 0; i < board.length; i++) {
    const row = i % sideLength + 1;
    const col = Math.floor(i / sideLength) + 1;
    if(board[i] !== 0) {
        const tile = document.createElement("div");
        if(board[i] === 1) {
            tile.className = "tile path";
        }
        if(board[i] === 2) {
            tile.className = "tile green";
        }
        if(board[i] === 3) {
            tile.className = "tile blue";
        }
        if(board[i] === 4) {
            tile.className = "tile pink";
        }
        if(board[i] === 5) {
            tile.className = "tile orange";
        }
        tile.style.gridArea = row + " / " + col;
        const cube = document.createElement("div");
        cube.className = "cube";
        const top = document.createElement("div");
        top.className = "side top";
        const bottom = document.createElement("div");
        bottom.className = "side bottom";
        const frontl = document.createElement("div");
        frontl.className = "side frontl";
        const frontr = document.createElement("div");
        frontr.className = "side frontr";
        const backl = document.createElement("div");
        backl.className = "side backl";
        const backr = document.createElement("div");
        backr.className = "side backr";
        cube.appendChild(top);
        cube.appendChild(bottom);
        cube.appendChild(frontl);
        cube.appendChild(frontr);
        cube.appendChild(backl);
        cube.appendChild(backr);
        tile.appendChild(cube);
        boardElement.appendChild(tile);
    }
}

for (const [color, positions] of Object.entries(figures)) {
    positions.forEach((position) => {
        const figure = document.createElement("div");
        figure.className = "figure " + color;
        figure.style.gridArea = position;
        const body = document.createElement("div");
        body.className = "body";
        const ears = document.createElement("div");
        ears.className = "ears";
        const head = document.createElement("div");
        head.className = "head";
        figure.appendChild(body);
        figure.appendChild(ears);
        figure.appendChild(head);
        boardElement.appendChild(figure);
    });
}


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
    let needsUpdate = true;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const moveSpeed = 20 / scale ** 1.5;

    let dx = 0, dy = 0;

    switch (e.code) {
        case "BracketRight": case "KeyP": if (scale < 2.0) { scale = Math.min(2.0, scale + 0.1) } break;
        case "Slash": case "KeyM": if (scale > 0.5) { scale = Math.max(0.5, scale - 0.1) } break;
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
    if (dx !== 0 || dy !== 0) {
        updateBoardTransform();
    }
});

document.addEventListener('wheel', (e) => {
    e.preventDefault();

    const oldScale = scale;

    if (e.deltaY < 0 && scale < 2.0) {
        scale = Math.min(2.0, scale + 0.1);
    } else if (e.deltaY > 0 && scale > 0.5) {
        scale = Math.max(0.5, scale - 0.1);
    }

    const scaleFactor = scale / oldScale;
    panX *= scaleFactor;
    panY *= scaleFactor;

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