import sendRequest from './services/server_service.js';

/**
 * Zeichnet die Handkarten des Spielers mit stilisierten, non-emoji Icons und Hover-Beschreibung.
 * @param {Array} cards - Eine Liste von Kartenobjekten vom Server.
 */
function renderHand(cards) {
    const handContainer = document.querySelector(".card-hand-container");
    handContainer.innerHTML = ''; // Leert den Container für die Aktualisierung

    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        const cardElement = document.createElement("div");
        let iconSymbol = '';
        let cardNumber = '';

        cardElement.title = card.description;

        if (card.type === 'StandardCard') {
            cardElement.className = "card move";
            iconSymbol = card.value;
            cardNumber = card.value;
        } else {
            cardElement.className = "card special";
            cardNumber = card.name;

            switch (card.name) {
                case "Flex Card":
                    iconSymbol = '±';
                    cardNumber = '4';
                    break;
                case "Inferno Card":
                    iconSymbol = '♠';
                    cardNumber = '7';
                    break;
                case "13/Start":
                    iconSymbol = '▶';
                    cardNumber = '13';
                    break;
                case "1/11/Start":
                    iconSymbol = '▶';
                    cardNumber = '1/11';
                    break;
                case "Joker Card":
                    iconSymbol = '?';
                    cardNumber = 'J';
                    break;
                case "Swap Card":
                    iconSymbol = '⇄';
                    cardNumber = 'S';
                    break;
            }
        }

        cardElement.innerHTML = `
            <span class="card-icon">${iconSymbol}</span>
            <span class="card-number">${cardNumber}</span>
            <span class="card-icon">${iconSymbol}</span>
        `;

        handContainer.appendChild(cardElement);
    });
}


/**
 * Zeichnet die Spielerliste, inklusive der Anzahl der Karten.
 * @param {Array} players - Eine Liste von Spielerobjekten.
 */
function renderPlayers(players) {
    const playerListContainer = document.querySelector(".player-list");
    playerListContainer.innerHTML = '';

    players.forEach(player => {
        const playerEntry = document.createElement("div");
        playerEntry.className = `player-entry ${player.color}`;

        const playerName = document.createElement("span");
        playerName.className = "player-name";
        playerName.innerText = player.name;

        const cardInfo = document.createElement("div");
        cardInfo.className = "player-card-info";

        const infoLabel = document.createElement("span");
        infoLabel.className = "card-info-label";
        infoLabel.innerText = "Cards";

        const cardCount = document.createElement("span");
        cardCount.className = "card-count";
        // Prüfen, ob "cards" eine Liste (für den eigenen Spieler) oder eine Zahl ist
        if (Array.isArray(player.cards)) {
            cardCount.innerText = player.cards.length;
        } else {
            cardCount.innerText = player.cards; // player.cards ist hier direkt die Zahl
        }

        cardInfo.appendChild(infoLabel);
        cardInfo.appendChild(cardCount);

        playerEntry.appendChild(playerName);
        playerEntry.appendChild(cardInfo);
        playerListContainer.appendChild(playerEntry);
    });
}

/**
 * Aktualisiert die gesamte Benutzeroberfläche basierend auf dem Spielzustand.
 * @param {object} gameState - Das Spielzustand-Objekt vom Server.
 * @param {string} localPlayerId - Die UUID des aktuellen Spielers.
 */
function updateUI(gameState, localPlayerId) {
    document.querySelector('.lobby-name h2').textContent = gameState.name;
    renderPlayers(gameState.players);

    const self = gameState.players.find(p => p.uuid === localPlayerId);
    if (self) {
        renderHand(self.cards);
    }

    const startGameBtn = document.querySelector('#start-game-btn');
    const isHost = gameState.host_id === localPlayerId;

    if (!gameState.game_started && isHost) {
        startGameBtn.style.display = 'block';
    } else {
        startGameBtn.style.display = 'none';
    }
}


/**
 * Die Hauptfunktion, die das Spiel initialisiert.
 */
async function initializeGame() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game_id');
    const localPlayerId = params.get('player_id');

    if (!gameId || !localPlayerId) {
        alert('Error: Game or Player ID is missing from the URL!');
        window.location.href = '/';
        return;
    }

    try {
        const gameState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${localPlayerId}`);
        console.log('Initial game state received:', gameState);

        if (!gameState) {
            alert('Could not load game data from server.');
            return;
        }

        updateUI(gameState, localPlayerId);

        const startGameBtn = document.querySelector('#start-game-btn');
        if (!startGameBtn.dataset.listenerAttached) {
            startGameBtn.addEventListener('click', async () => {
                try {
                    await sendRequest(`http://127.0.0.1:7777/game/${gameId}/start`, 'POST');
                    const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${localPlayerId}`);
                    updateUI(updatedState, localPlayerId);
                } catch (error) {
                    alert('Could not start the game.');
                    console.error(error);
                }
            });
            startGameBtn.dataset.listenerAttached = 'true';
        }

    } catch (error) {
        console.error('Failed to get game state:', error);
        alert('Could not load the game.');
    }
}

document.addEventListener('DOMContentLoaded', initializeGame);