import sendRequest from './services/server_service.js';
import gameService from './services/game_service.js';
import { renderFigures } from './game_board.js';


function renderPlayButton() {
    const container = document.querySelector('.play-action-container');
    container.innerHTML = '';

    const cardIndex = gameService.getSelectedCardIndex();
    const figureId = gameService.getSelectedFigureId();

    if (cardIndex === null || figureId === null) return;

    const selectedCard = gameService.getHand()[cardIndex];
    const selectedFigure = gameService.getLocalPlayer().figures.find(f => f.uuid === figureId);

    // NEUE LOGIK für Startkarten
    if (selectedCard.type === 'StartCard') {
        // Fall 1: Figur ist in der Home-Base -> "Starten"-Button
        if (selectedFigure.position === -1) {
            const startButton = document.createElement('button');
            startButton.className = 'button green';
            startButton.textContent = 'Figur starten';
            startButton.addEventListener('click', () => executePlay({action: 'start'}));
            container.appendChild(startButton);
            return;
        }

        // Fall 2: Figur ist auf dem Feld, prüfe Anzahl der Zugoptionen
        if (selectedCard.move_values.length > 1) {
            // Wenn es MEHR als eine Option gibt (z.B. 1/11), zeige für jede einen Button
            selectedCard.move_values.forEach(value => {
                const moveButton = document.createElement('button');
                moveButton.className = 'button blue';
                moveButton.textContent = `${value} Feld(er) ziehen`;
                moveButton.addEventListener('click', () => executePlay({action: 'move', value: value}));
                container.appendChild(moveButton);
            });
            return;
        }
    }
    // Logik für die FlexCard (bleibt gleich)
    if (selectedCard.type === 'FlexCard') {
        const forwardButton = document.createElement('button');
        forwardButton.className = 'button green';
        forwardButton.textContent = '4 Vorwärts';
        forwardButton.addEventListener('click', () => executePlay({ direction: 'forward' }));

        const backwardButton = document.createElement('button');
        backwardButton.className = 'button pink';
        backwardButton.textContent = '4 Rückwärts';
        backwardButton.addEventListener('click', () => executePlay({ direction: 'backward' }));

        container.appendChild(forwardButton);
        container.appendChild(backwardButton);
        return;
    }

    if (selectedCard.type === 'SwapCard') {
        const targetFigureId = gameService.getSelectedTargetFigureId();
        if (figureId && targetFigureId) {
            const swapButton = document.createElement('button');
            swapButton.className = 'button purple'; // Neue Farbe zur Abwechslung
            swapButton.textContent = 'Figuren tauschen';
            swapButton.addEventListener('click', () => executePlay({
                figure_uuid: figureId,
                other_figure_uuid: targetFigureId
            }));
            container.appendChild(swapButton);
        }
        return;
    }

    // Standard-Button für alle anderen Karten
    const playButton = document.createElement('button');
    playButton.className = 'button orange';
    playButton.textContent = 'Play Card';
    playButton.addEventListener('click', () => executePlay());
    container.appendChild(playButton);
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

function renderInfernoControls() {
    const container = document.querySelector('.inferno-controls-container');
    const selectedCard = gameService.getHand()[gameService.getSelectedCardIndex()];

    if (selectedCard && selectedCard.type === 'InfernoCard') {
        container.style.display = 'block';
        const pointsLeft = gameService.getInfernoPointsRemaining();
        container.innerHTML = `<div class="inferno-points-display">${pointsLeft} Punkte übrig</div>`;

        // Zeige den Bestätigen-Button nur, wenn genau 0 Punkte übrig sind
        if (pointsLeft === 0) {
            const confirmButton = document.createElement('button');
            confirmButton.className = 'button red';
            confirmButton.textContent = 'Inferno-Zug bestätigen';
            confirmButton.onclick = () => {
                const moves = gameService.getInfernoMovePlan().map(move => ({
                    figure_uuid: move.figureId,
                    steps: move.steps
                }));
                executePlay({ moves: moves });
            };
            container.appendChild(confirmButton);
        }
    } else {
        container.style.display = 'none';
    }
}

/**
 * Aktualisiert die gesamte Benutzeroberfläche basierend auf dem Spielzustand.
 */
export function updateUI() {
    document.querySelector('.lobby-name h2').textContent = gameService.gameState.name;
    renderPlayers();
    renderHand();
    renderFigures();
    renderPlayButton();
    renderInfernoControls();

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


async function executePlay(extraDetails = {}) {
    const gameId = gameService.gameState.uuid;
    const playerId = gameService.localPlayerId;
    const cardIndex = gameService.getSelectedCardIndex();

    const playedCard = gameService.getHand()[cardIndex];
    if (!playedCard) {
        alert("Card not found!");
        return;
    }

    let actionDetails = { ...extraDetails };

    // --- FINALE KORREKTUR HIER ---
    // Behandle die Inferno-Karte als ersten Sonderfall, da sie keine einzelne Zielfigur benötigt.
    if (playedCard.type === 'InfernoCard') {
        actionDetails.action = 'inferno';
        actionDetails.figure_uuid = gameService.getSelectedFigureId();
        // Der 'moves'-Plan wird bereits korrekt in extraDetails übergeben.
    } else {
        // Für alle anderen Karten benötigen wir eine einzelne ausgewählte Figur.
        const figureId = gameService.getSelectedFigureId();
        const targetFigure = gameService.getFigureById(figureId);

        if (!targetFigure) {
            alert("Figure not found! Please select a figure to play your card on.");
            return;
        }

        actionDetails.figure_uuid = figureId;

        // Zusätzliche Logik für die anderen Kartentypen
        switch (playedCard.type) {
            case 'StartCard':
                if (!actionDetails.action) {
                    actionDetails.action = 'move';
                    actionDetails.value = playedCard.move_values[0];
                }
                break;
            case 'SwapCard':
                actionDetails.action = 'swap';
                //actionDetails.figure_uuid = figureId;
                actionDetails.other_figure_uuid = gameService.getSelectedTargetFigureId();
                break;
            // Standardkarten und FlexCard benötigen keine spezielle Logik hier
        }
    }

    try {
        const requestBody = {
            player_uuid: playerId,
            card_index: cardIndex,
            action_details: actionDetails
        };

        await sendRequest(`http://127.0.0.1:7777/game/${gameId}/play`, 'POST', requestBody);

        const updatedState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${playerId}`);
        gameService.resetSelections(); // Auswahl nach dem Zug zurücksetzen
        gameService.updateGameState(updatedState, playerId);

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