import sendRequest from './services/server_service.js';


function renderHand(cards) {
    const handContainer = document.querySelector(".card-hand-container");
    handContainer.innerHTML = ''; // Leert die alte Hand

    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        const cardElement = document.createElement("div");
        // Später können wir hier je nach Kartentyp unterschiedliche Klassen vergeben
        cardElement.className = "card special";

        const numberElement = document.createElement("span");
        numberElement.className = "card-number";
        numberElement.innerText = card.name; // Zeigt den Namen der Karte an

        cardElement.appendChild(numberElement);
        handContainer.appendChild(cardElement);
    });
}


function renderPlayers(players) {
    const playerListContainer = document.querySelector(".player-list");
    playerListContainer.innerHTML = ''; // Leert die alte Liste

    players.forEach(player => {
        const playerEntry = document.createElement("div");
        playerEntry.className = `player-entry ${player.color}`;

        const playerName = document.createElement("span");
        playerName.className = "player-name";
        playerName.innerText = player.name;

        playerEntry.appendChild(playerName);
        playerListContainer.appendChild(playerEntry);
    });
}


async function initializeGame() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game_id');
    const localPlayerId = params.get('player_id');

    if (!gameId) {
        alert('No game ID found!');
        window.location.href = '/';
        return;
    }

    try {
        // 1. Lade den anfänglichen Zustand des Spiels
        const gameState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state`);
        console.log('Game state received:', gameState);

        if (!gameState) {
            alert('Could not load game data from server.');
            return;
        }

        // 2. Aktualisiere die UI mit den erhaltenen Daten
        document.querySelector('.lobby-name h2').textContent = gameState.name;
        renderPlayers(gameState.players); // Diese Zeile ist entscheidend für die Anzeige der Spielernamen

        // 3. Logik für den "Start Game"-Button
        const startGameBtn = document.querySelector('#start-game-btn');
        const isHost = gameState.host_id === localPlayerId;

        if (!gameState.game_started && isHost) {
            startGameBtn.style.display = 'block';
        } else {
            startGameBtn.style.display = 'none';
        }

        // Event-Listener nur einmal hinzufügen, falls er noch nicht existiert
        if (!startGameBtn.dataset.listenerAttached) {
            startGameBtn.addEventListener('click', async () => {
                try {
                    await sendRequest(`http://127.0.0.1:7777/game/${gameId}/start`, 'POST');
                    startGameBtn.style.display = 'none';

                    // Lade den Zustand neu, um die ausgeteilten Karten zu erhalten
                    const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state`);

                    // Finde den aktuellen Spieler in der Liste, um seine Karten anzuzeigen
                    const self = updatedState.players.find(p => p.uuid === localPlayerId);
                    if (self) {
                        renderHand(self.cards);
                    }

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

// Starte die Initialisierung, wenn die Seite vollständig geladen ist
document.addEventListener('DOMContentLoaded', initializeGame);