import sendRequest from './services/server_service.js';

/**
 * Zeichnet die Handkarten des aktuellen Spielers.
 * @param {Array} cards - Eine Liste von Kartenobjekten.
 */
function renderHand(cards) {
    const handContainer = document.querySelector(".card-hand-container");
    handContainer.innerHTML = '';

    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "card special";

        const numberElement = document.createElement("span");
        numberElement.className = "card-number";
        numberElement.innerText = card.name;

        cardElement.appendChild(numberElement);
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

        // NEUER TEIL: Anzeige der Kartenanzahl
        const cardInfo = document.createElement("div");
        cardInfo.className = "player-card-info";

        const infoLabel = document.createElement("span");
        infoLabel.className = "card-info-label";
        infoLabel.innerText = "Cards";

        const cardCount = document.createElement("span");
        cardCount.className = "card-count";
        cardCount.innerText = player.cards.length; // Wir zeigen die Anzahl der Karten an

        cardInfo.appendChild(infoLabel);
        cardInfo.appendChild(cardCount);

        playerEntry.appendChild(playerName);
        playerEntry.appendChild(cardInfo); // Füge die Karten-Info hinzu
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
        const gameState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state`);
        console.log('Initial game state received:', gameState);

        if (!gameState) {
            alert('Could not load game data from server.');
            return;
        }

        // Rufe die zentrale UI-Update-Funktion auf
        updateUI(gameState, localPlayerId);

        const startGameBtn = document.querySelector('#start-game-btn');
        if (!startGameBtn.dataset.listenerAttached) {
            startGameBtn.addEventListener('click', async () => {
                try {
                    await sendRequest(`http://127.0.0.1:7777/game/${gameId}/start`, 'POST');

                    // Lade den Zustand neu und aktualisiere die gesamte UI
                    const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state`);
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