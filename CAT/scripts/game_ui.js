import sendRequest from './services/server_service.js';
import gameService from './services/game_service.js';
import { renderFigures } from './game_board.js';

let socket = null;

function renderPlayButton() {
    const container = document.querySelector('.play-action-container');
    container.innerHTML = '';

    const cardIndex = gameService.getSelectedCardIndex();
    const figureId = gameService.getSelectedFigureId();

    if (cardIndex === null || figureId === null) return;

    let selectedCard = gameService.getHand()[cardIndex];
    const localPlayer = gameService.getLocalPlayer();
    if (!localPlayer) return;

    const selectedFigure = localPlayer.figures.find(f => f.uuid === figureId);
    if(!selectedFigure) return;

    // Wenn ein Joker gespielt wird, ist die "ausgewählte Karte" die, die imitiert wird
    if(selectedCard.type === 'JokerCard') {
        const jokerImitation = gameService.getJokerImitation();
        if(!jokerImitation) return; // Wenn noch keine Auswahl getroffen, keinen Button zeigen
        selectedCard = jokerImitation;
    }

    if (!selectedCard) return;

    if (selectedCard.type === 'StartCard') {
        if (selectedFigure.position === -1) {
            const startButton = document.createElement('button');
            startButton.className = 'button green';
            startButton.textContent = 'Figur starten';
            startButton.addEventListener('click', () => executePlay({ action: 'start' }));
            container.appendChild(startButton);
            return;
        }

        if (selectedCard.move_values.length > 1) {
            selectedCard.move_values.forEach(value => {
                const moveButton = document.createElement('button');
                moveButton.className = 'button blue';
                moveButton.textContent = `${value} Feld(er) ziehen`;
                moveButton.addEventListener('click', () => executePlay({ action: 'move', value: value }));
                container.appendChild(moveButton);
            });
            return;
        }
    }

    if (selectedCard.type === 'FlexCard' && selectedFigure.position !== -1) {
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
            swapButton.className = 'button purple';
            swapButton.textContent = 'Figuren tauschen';
            swapButton.addEventListener('click', () => executePlay({
                own_figure_uuid: figureId,
                other_figure_uuid: targetFigureId
            }));
            container.appendChild(swapButton);
        }
        return;
    }

    const playButton = document.createElement('button');
    playButton.className = 'button orange';
    playButton.textContent = 'Play Card';
    playButton.addEventListener('click', () => executePlay());
    container.appendChild(playButton);
}

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
                const card = cards[index];
                if (card.type === 'JokerCard') {
                    openJokerModal();
                    gameService.selectCard(index);
                } else {
                    gameService.selectCard(index);
                    document.dispatchEvent(new Event('selectionChanged'));
                }
            });
        }

        handContainer.appendChild(cardElement);
    });
}

function renderPlayers() {
    const players = gameService.getPlayers();
    const playerListContainer = document.querySelector(".player-list");
    playerListContainer.innerHTML = '';

    // Hole den Index des aktuellen Spielers vom Service
    const currentPlayerIndex = gameService.gameState.current_player_index;

    players.forEach(player => {
        const playerEntry = document.createElement("div");
        playerEntry.className = `player-entry ${player.color}`;

        // NEU: Prüfe, ob die Nummer des Spielers mit dem aktuellen Index übereinstimmt
        if (player.number === currentPlayerIndex) {
            playerEntry.classList.add('active-player');
        }

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
    let selectedCard = gameService.getHand()[gameService.getSelectedCardIndex()];

    // --- KORREKTUR FÜR INFERNO/JOKER ---
    let isInfernoActive = false;
    if (selectedCard) {
        if (selectedCard.type === 'InfernoCard') {
            isInfernoActive = true;
        } else if (selectedCard.type === 'JokerCard') {
            const jokerImitation = gameService.getJokerImitation();
            if (jokerImitation && jokerImitation.type === 'InfernoCard') {
                isInfernoActive = true;
            }
        }
    }

    if (isInfernoActive) {
        container.style.display = 'block';
        const pointsLeft = gameService.getInfernoPointsRemaining();
        container.innerHTML = `<div class="inferno-points-display">${pointsLeft} Punkte übrig</div>`;

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

async function openJokerModal() {
    const modalOverlay = document.getElementById('joker-modal-overlay');
    const grid = document.getElementById('joker-card-selection-grid');
    grid.innerHTML = '<h4>Lade Karten...</h4>';

    modalOverlay.style.display = 'flex';

    try {
        const availableCards = await sendRequest('http://127.0.0.1:7777/game/card_types');
        grid.innerHTML = '';

        availableCards.forEach(cardData => {
            const cardElement = document.createElement("div");
            cardElement.title = cardData.description;

            let iconSymbol = '';
            let cardNumber = '';

            if (cardData.type === 'StandardCard') {
                cardElement.className = "card move";
                iconSymbol = cardData.value;
                cardNumber = cardData.value;
            } else {
                cardElement.className = "card special";
                cardNumber = cardData.name;
                switch (cardData.name) {
                    case "Flex Card": iconSymbol = '±'; cardNumber = '4'; break;
                    case "Inferno Card": iconSymbol = '♠'; cardNumber = '7'; break;
                    case "Swap Card": iconSymbol = '⇄'; cardNumber = 'S'; break;
                    case "13/Start": iconSymbol = '▶'; cardNumber = '13'; break;
                    case "1/11/Start": iconSymbol = '▶'; cardNumber = '1/11'; break;
                }
            }
            cardElement.innerHTML = `<span class="card-icon">${iconSymbol}</span><span class="card-number">${cardNumber}</span><span class="card-icon">${iconSymbol}</span>`;

            cardElement.addEventListener('click', () => {
                gameService.setJokerImitation(cardData);
                modalOverlay.style.display = 'none';
                document.dispatchEvent(new Event('selectionChanged'));
            });
            grid.appendChild(cardElement);
        });

    } catch (error) {
        grid.innerHTML = '<h4>Fehler beim Laden der Karten.</h4>';
        console.error("Could not fetch card types:", error);
    }
}

function renderDiscardPile() {
    const container = document.getElementById('discard-pile-container');
    const lastCard = gameService.gameState.last_played_card;

    if (!lastCard) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = ''; // Leere den alten Inhalt
    container.style.display = 'block';

    const cardElement = document.createElement("div");
    // Nutze exakt dieselbe Logik wie in renderHand, um die Karte zu erstellen
    let iconSymbol = '';
    let cardNumber = '';

    if (lastCard.type === 'StandardCard') {
        cardElement.className = "card move";
        iconSymbol = lastCard.value;
        cardNumber = lastCard.value;
    } else {
        cardElement.className = "card special";
        cardNumber = lastCard.name;
        switch (lastCard.name) {
            case "Flex Card": iconSymbol = '±'; cardNumber = '4'; break;
            case "Inferno Card": iconSymbol = '♠'; cardNumber = '7'; break;
            case "Swap Card": iconSymbol = '⇄'; cardNumber = 'S'; break;
            case "13/Start": iconSymbol = '▶'; cardNumber = '13'; break;
            case "1/11/Start": iconSymbol = '▶'; cardNumber = '1/11'; break;
            case "Joker Card": iconSymbol = '?'; cardNumber = 'J'; break;
        }
    }
    cardElement.innerHTML = `<span class="card-icon">${iconSymbol}</span><span class="card-number">${cardNumber}</span><span class="card-icon">${iconSymbol}</span>`;

    container.appendChild(cardElement);
}

export function updateUI() {
    document.querySelector('.lobby-name h2').textContent = gameService.gameState.name;
    document.getElementById('round-display').textContent = `Round: ${gameService.gameState.round_number}`;
    renderPlayers();
    renderHand();
    renderFigures();
    renderPlayButton();
    renderInfernoControls();
    renderDiscardPile();

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

    let playedCard = gameService.getHand()[cardIndex];
    if (!playedCard) {
        alert("Card not found!");
        return;
    }

    let actionDetails = { ...extraDetails };

    // KORREKTE JOKER-LOGIK
    if (playedCard.type === 'JokerCard') {
        const jokerImitation = gameService.getJokerImitation();
        if (!jokerImitation) {
             alert("You must select a card for the Joker to imitate!");
             return;
        }

        // Backend erwartet für Startkarten den Namen "Start", nicht "13/Start"
        actionDetails.imitate_card_name = jokerImitation.type === 'StartCard' ? 'Start' : jokerImitation.name;

        if (jokerImitation.type === 'StartCard') {
            actionDetails.move_values = jokerImitation.move_values;
        }

        // Wechsle die Referenz, damit die restliche Logik mit der imitierten Karte arbeitet
        playedCard = jokerImitation;
    }

    // Für die Inferno-Karte benötigen wir keine einzelne Figur
    if (playedCard.type === 'InfernoCard') {
        actionDetails.action = 'inferno';
        actionDetails.moves = extraDetails.moves;
    } else {
        const figureId = gameService.getSelectedFigureId();
        if (!figureId) {
            alert("Figure not selected!");
            return;
        }
        actionDetails.figure_uuid = figureId;

        // Logik für die anderen Karten
        if (playedCard.type === 'StartCard' && !actionDetails.action) {
            actionDetails.action = 'move';
            actionDetails.value = playedCard.move_values[0];
        } else if (playedCard.type === 'SwapCard') {
            actionDetails.action = 'swap';
            actionDetails.own_figure_uuid = figureId;
            actionDetails.other_figure_uuid = gameService.getSelectedTargetFigureId();
        } else if (!actionDetails.action) {
            actionDetails.action = 'move';
        }
    }

    try {
        const requestBody = {
            player_uuid: playerId,
            card_index: cardIndex,
            action_details: actionDetails
        };

        await sendRequest(`http://127.0.0.1:7777/game/${gameId}/play`, 'POST', requestBody);

        gameService.resetSelections();
        renderPlayButton();

    } catch (error) {
        console.error("Error playing card:", error);
        alert(error.message);
    }
}


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

        // NEU: Baue die WebSocket-Verbindung auf
        const ws_url = `ws://127.0.0.1:7777/game/ws/${gameId}/${localPlayerId}`;
        socket = new WebSocket(ws_url);

        socket.onopen = () => {
            console.log("WebSocket connection established.");
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            // Prüfe, ob es eine Update-Nachricht ist
            if (message.event === 'update') {
                console.log("Update-Nudge from server received. Refetching state.");
                // Rufe eine Funktion auf, die den personalisierten Zustand neu lädt
                fetchAndUpdateState();
            }
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed.");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

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

        // KORREKTE PLATZIERUNG DES EVENT-LISTENERS
        document.getElementById('joker-cancel-btn').addEventListener('click', () => {
            document.getElementById('joker-modal-overlay').style.display = 'none';
            gameService.resetSelections();
            updateUI();
        });

    } catch (error) {
        console.error('Failed to get game state:', error);
        alert('Could not load the game.');
    }
}

async function fetchAndUpdateState() {
    const gameId = gameService.gameState.uuid;
    const localPlayerId = gameService.localPlayerId;

    if (!gameId || !localPlayerId) return;

    try {
        const newState = await sendRequest(`http://127.0.0.1:7777/game/${gameId}/state?player_id=${localPlayerId}`);
        gameService.updateGameState(newState, localPlayerId);
        updateUI();
    } catch (error) {
        console.error("Failed to refetch state after update:", error);
    }
}

document.addEventListener('DOMContentLoaded', initializeGame);
document.addEventListener('selectionChanged', () => {
    updateUI();
});