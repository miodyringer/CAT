import sendRequest from './services/server_service.js';

// NEUE FUNKTION: Rendert die Kartenhand eines Spielers
function renderHand(cards) {
    const handContainer = document.querySelector(".card-hand-container");
    handContainer.innerHTML = ''; // Alte Hand leeren

    if (!cards) return;

    cards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "card special"; // Vereinfacht für den Anfang

        const numberElement = document.createElement("span");
        numberElement.className = "card-number";
        numberElement.innerText = card.name; // Zeigt den Kartennamen an

        cardElement.appendChild(numberElement);
        handContainer.appendChild(cardElement);
    });
}


// Funktion zum Rendern der Spielerliste
function renderPlayers(players) {
    const playerListContainer = document.querySelector(".player-list");
    playerListContainer.innerHTML = ''; // Leere die alte Liste

    players.forEach(player => {
        const playerEntry = document.createElement("div");
        // Wir verwenden die Farbe, die vom Backend kommt
        playerEntry.className = `player-entry ${player.color}`;

        const playerName = document.createElement("span");
        playerName.className = "player-name";
        playerName.innerText = player.name;
        playerEntry.appendChild(playerName);

        // Hier könntest du noch mehr Infos hinzufügen, z.B. die Anzahl der Karten
        // const cardInfo = document.createElement("div"); ...

        playerListContainer.appendChild(playerEntry);
    });
}

// Hauptfunktion zum Initialisieren des Spiels
async function initializeGame() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game_id');
    // Hole unsere gespeicherte Spieler-ID aus dem localStorage
    const localPlayerId = localStorage.getItem('player_id');

    if (!gameId) { /* ... */ }

    try {
        const gameState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state`);
        // ... (UI aktualisieren) ...

        // *** HIER IST DIE NEUE LOGIK ***
        const startGameBtn = document.querySelector('#start-game-btn');

        // Finde heraus, ob wir der Host sind
        const isHost = gameState.players.length > 0 && gameState.players[0].uuid === localPlayerId;

        // Zeige den Button nur an, wenn das Spiel noch nicht gestartet ist UND wir der Host sind
        if (!gameState.game_started && isHost) {
            startGameBtn.style.display = 'block';
        } else {
            startGameBtn.style.display = 'none'; // Ansonsten explizit verstecken
        }

        startGameBtn.addEventListener('click', async () => {
            try {
                await sendRequest(`http://127.0.0.1:7777/game/${gameId}/start`, 'POST');
                startGameBtn.style.display = 'none'; // Verstecke den Button nach dem Klick

                // Lade den Spielzustand neu, um die ausgeteilten Karten zu bekommen
                const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state`);
                renderHand(updatedState.players[0].cards); // Zeigt die Karten des ersten Spielers

            } catch (error) {
                alert('Could not start the game.');
                console.error(error);
            }
        });

    } catch (error) { /* ... (bleibt gleich) ... */ }
}

document.addEventListener('DOMContentLoaded', initializeGame);