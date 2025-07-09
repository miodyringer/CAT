import sendRequest from './services/server_service.js';
import gameService from './services/game_service.js';
import { renderFigures } from './game_board.js';


function renderPlayButton() {
    const container = document.querySelector('.play-action-container');
    container.innerHTML = ''; // Leert den Container

    const cardIndex = gameService.getSelectedCardIndex();
    const figureId = gameService.getSelectedFigureId();

    // Zeige den Button nur an, wenn BEIDES ausgewählt ist
    if (cardIndex !== null && figureId !== null) {
        const playButton = document.createElement('button');
        playButton.className = 'button orange';
        playButton.textContent = 'Play Card';

        playButton.addEventListener('click', async () => {
            await executePlay(); // Diese Funktion erstellen wir im nächsten Schritt
        });

        container.appendChild(playButton);
    }
}

/**
 * Zeichnet die Handkarten des aktuellen Spielers.
 */
function renderHand() {
    const cards = gameService.getHand();
    const handContainer = document.querySelector(".card-hand-container");
    handContainer.innerHTML = '';
    if (!cards || cards.length === 0) return;
    cards.forEach((card, index) => {
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
                case "Flex Card": iconSymbol = '±'; cardNumber = '4'; break;
                case "Inferno Card": iconSymbol = '♠'; cardNumber = '7'; break;
                case "13/Start": iconSymbol = '▶'; cardNumber = '13'; break;
                case "1/11/Start": iconSymbol = '▶'; cardNumber = '1/11'; break;
                case "Joker Card": iconSymbol = '?'; cardNumber = 'J'; break;
                case "Swap Card": iconSymbol = '⇄'; cardNumber = 'S'; break;
            }
        }
        cardElement.innerHTML = `<span class="card-icon">${iconSymbol}</span><span class="card-number">${cardNumber}</span><span class="card-icon">${iconSymbol}</span>`;

        if (index === gameService.getSelectedCardIndex()) {
                cardElement.classList.add("selected");

            }

            if (gameService.isLocalPlayerTurn()) {
                cardElement.addEventListener('click', () => {
                    gameService.selectCard(index);
                    document.dispatchEvent(new Event('selectionChanged'));
                });
            }

        handContainer.appendChild(cardElement);
    });
}

/**
 * Zeichnet die Spielerliste, inklusive der Anzahl der Karten.
 */
function renderPlayers() {
    const players = gameService.getPlayers();
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
        if (Array.isArray(player.cards)) {
            cardCount.innerText = player.cards.length;
        } else {
            cardCount.innerText = player.cards;
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
 */
function updateUI() {
    document.querySelector('.lobby-name h2').textContent = gameService.gameState.name;
    renderPlayers();
    renderHand();
    renderFigures();
    renderPlayButton();

    const startGameBtn = document.querySelector('#start-game-btn');
    const isHost = gameService.gameState.host_id === gameService.localPlayerId;

    if (gameService.isLocalPlayerTurn()) {
        document.body.classList.remove('not-my-turn');
    } else {
        document.body.classList.add('not-my-turn');
    }

    if (!gameService.gameState.game_started && isHost) {
        startGameBtn.style.display = 'block';
    } else {
        startGameBtn.style.display = 'none';
    }
}


async function executePlay() {
    const gameId = gameService.gameState.uuid;
    const playerId = gameService.localPlayerId;
    const cardIndex = gameService.getSelectedCardIndex();
    const figureId = gameService.getSelectedFigureId();

    const localPlayer = gameService.getLocalPlayer();
    if (!localPlayer) return;

    // Finde die ausgewählte Karte und die ausgewählte Figur
    const playedCard = localPlayer.cards[cardIndex];
    const targetFigure = localPlayer.figures.find(f => f.uuid === figureId);

    if (!playedCard || !targetFigure) {
        alert("Card or Figure not found!");
        return;
    }

    // Erstelle die action_details
    const actionDetails = {
        figure: targetFigure // Backend erwartet ein 'figure' Objekt
    };

    // NEUE LOGIK: Entscheide, welche Aktion ausgeführt werden soll
    // Prüfen, ob es eine Startkarte ist UND die Figur in der Home-Base ist (Position -1)
    if (playedCard.type === 'StartCard' && targetFigure.position === -1) {
        actionDetails.action = 'start';
    } else {
        // Andernfalls ist es eine normale "move"-Aktion
        actionDetails.action = 'move';
        // Für Startkarten müssen wir den Wert mitsenden (z.B. 1 oder 11)
        // Das implementieren wir im nächsten Schritt, für jetzt funktioniert es mit Standardkarten.
        if(playedCard.type === 'StartCard') {
            actionDetails.value = playedCard.move_values[0]; // Nimm vorerst den ersten möglichen Wert
        }
    }

    try {
        // Das Request Body Schema vom Backend erwartet die UUID der Figur, nicht das ganze Objekt
        const requestBody = {
            player_uuid: playerId,
            card_index: cardIndex,
            action_details: {
                action: actionDetails.action,
                figure_uuid: figureId, // Sende die UUID
                value: actionDetails.value // Sende den Wert, falls vorhanden
            }
        };

        await sendRequest(`http://127.0.0.1:7777/game/${gameId}/play`, 'POST', requestBody);

        // Spielzustand nach dem Zug vom Server holen und UI aktualisieren
        const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${playerId}`);
        gameService.updateGameState(updatedState, playerId);

        // Auswahl zurücksetzen
        gameService.selectCard(null);
        gameService.selectFigure(null);

        updateUI();

    } catch (error) {
        console.error("Error playing card:", error);
        alert(`Invalid Move: ${error.message}`);
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
        const gameStateFromServer = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${localPlayerId}`);

        if (!gameStateFromServer) {
            alert('Could not load game data from server.');
            return;
        }

        gameService.updateGameState(gameStateFromServer, localPlayerId);

        updateUI();

        const startGameBtn = document.querySelector('#start-game-btn');
        if (!startGameBtn.dataset.listenerAttached) {
            startGameBtn.addEventListener('click', async () => {
                try {
                    await sendRequest(`http://127.0.0.1:7777/game/${gameId}/start`, 'POST');
                    const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${localPlayerId}`);
                    gameService.updateGameState(updatedState, localPlayerId);
                    updateUI();
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
document.addEventListener('selectionChanged', () => {
    updateUI();
});