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

const camera = document.querySelector("#camera-container");
let zoom = 100;
let x = 50;
let y = 50;

document.addEventListener('keydown', (e) => {
    if (e.code === "BracketRight" || e.code === "KeyP" && zoom < 200 ) { zoom += 10 }
    else if (e.code === "Slash" || e.code === "KeyM" && zoom > 50) { zoom -= 10 }
    else if (e.code === "ArrowUp" || e.code === "KeyW") { y += 5 }
    else if (e.code === "ArrowLeft" || e.code === "KeyA") { x += 5 }
    else if (e.code === "ArrowDown" || e.code === "KeyS") { y -= 5 }
    else if (e.code === "ArrowRight" || e.code === "KeyD") { x -= 5 }
    else if (e.code === "KeyR") {
        zoom = 100;
        x = 50;
        y = 50;
    }
    camera.style.left = x + "%";
    camera.style.top = y + "%";
    camera.style.zoom = zoom + "%";
});

document.addEventListener('wheel', (e) => {
    if (e.deltaY < 0 && zoom < 200) {
        zoom += 10;
    } else if (e.deltaY > 0 && zoom > 50) {
        zoom -= 10;
    }
    camera.style.zoom = zoom + "%";
});

const panState = {
    isPanning: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
};

camera.addEventListener('mousedown', (e) => {
    e.preventDefault();

    panState.isPanning = true;
    panState.startX = e.clientX;
    panState.startY = e.clientY;
    panState.lastX = e.clientX;
    panState.lastY = e.clientY;

    camera.classList.add('active');
});

camera.addEventListener('mousemove', (e) => {
    if (!panState.isPanning) {
        return;
    }
    e.preventDefault();

    const deltaX = e.clientX - panState.lastX;
    const deltaY = e.clientY - panState.lastY;

    panState.lastX = e.clientX;
    panState.lastY = e.clientY;

    x += deltaX/20;
    y += deltaY/20;
    camera.style.left = x + "%";
    camera.style.top = y + "%";
});

window.addEventListener('mouseup', (e) => {
    if (panState.isPanning) {
        panState.isPanning = false;
        camera.classList.remove('active');
    }
});

boardElement.addEventListener('mouseleave', (e) => {
    if (panState.isPanning) {
        panState.isPanning = false;
        camera.classList.remove('active');
    }
});




    