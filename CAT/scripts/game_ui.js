const self = {"name": "Dana", "cards": 4};

const players = [
    {"name": "Alex", "cards": 5},
    {"name": "Ben", "cards": 4},
    {"name": "Clara", "cards": 4},
    self
];

const cards = [
    {"type": "move", "number": "2"},
    {"type": "special", "number": "7"},
    {"type": "special", "number": "1/11"},
    {"type": "special", "number": "13"},
    {"type": "special", "number": "4"},
    {"type": "special", "number": "S"},
    {"type": "special", "number": "J"},
    
]

for (let i = 0; i < players.length; i++) {
    const playerEntry = document.createElement("div");
    if (i === 0) { playerEntry.className = "player-entry green" }
    if (i === 1) { playerEntry.className = "player-entry blue" }
    if (i === 2) { playerEntry.className = "player-entry pink" }
    if (i === 3) { playerEntry.className = "player-entry orange" }
    const playerColor = document.createElement("div");
    playerColor.className = "player-color";
    const playerName = document.createElement("span");
    playerName.className = "player-name";
    playerName.innerText = players[i].name;
    const cardInfo = document.createElement("div");
    cardInfo.className = "player-card-info";
    const infoLabel = document.createElement("span");
    infoLabel.className = "card-info-label";
    infoLabel.innerText = "Cards";
    const cardCount = document.createElement("span");
    cardCount.className = "card-count";
    cardCount.innerText = players[i].cards + " / 6";
    cardInfo.appendChild(infoLabel);
    cardInfo.appendChild(cardCount);
    playerEntry.appendChild(playerColor);
    playerEntry.appendChild(playerName);
    playerEntry.appendChild(cardInfo);
    document.querySelector(".player-list").appendChild(playerEntry);
}

cards.forEach(card => {
    const cardElement = document.createElement("div");
    cardElement.className = "card " + card.type;
    const numberElement = document.createElement("span");
    numberElement.className = "card-number";
    numberElement.innerText = card.number;
    cardElement.appendChild(numberElement);
    if (card.type === "special"){
        const iconTop = document.createElement("span");
        iconTop.className = "card-icon";
        const iconBottom = document.createElement("span");
        iconBottom.className = "card-icon";
        if (card.number === "4") {
            iconTop.innerText = "+";
            iconBottom.innerText = "-";
        }
        if (card.number === "7") {
            iconTop.innerText = "f";
            iconBottom.innerText = "f";
        }
        if (card.number === "1/11") {
            iconTop.innerText = "p";
            iconBottom.innerText = "p";
        }
        if (card.number === "13") {
            iconTop.innerText = "p";
            iconBottom.innerText = "p";
        }
        cardElement.prepend(iconTop);
        cardElement.appendChild(iconBottom);
    }
    document.querySelector(".card-hand-container").appendChild(cardElement);
});