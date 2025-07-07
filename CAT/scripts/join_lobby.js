import sendRequest from './services/server_service.js';

// 1. Parameter aus der URL auslesen
const params = new URLSearchParams(document.location.search);
const lobbyId = params.get('lobbyId');
const lobbyName = params.get('lobbyName');

// 2. HTML-Elemente holen
const lobbyNameTitle = document.querySelector('#lobby-name');
const playerNameInput = document.querySelector('#player-name');
const joinGameBtn = document.querySelector('#join-game-btn');

// Lobby-Namen im Titel anzeigen
if (lobbyNameTitle && lobbyName) {
    lobbyNameTitle.textContent += ` "${lobbyName}"`;
}

// 3. Klick-Listener für den Join-Button hinzufügen
joinGameBtn.addEventListener('click', async () => {
    const playerName = playerNameInput.value;

    if (!playerName) {
        alert('Please enter a player name.');
        return;
    }
    if (!lobbyId) {
        alert('Error: No Lobby ID found!');
        return;
    }

    // 4. Daten für die API-Anfrage vorbereiten
    const requestBody = {
        player_name: playerName
    };

    try {
        // Der Join-Endpunkt gibt jetzt auch die player_id zurück
        const response = await sendRequest(`http://127.0.0.1:7777/lobby/${lobbyId}/join`, 'POST', requestBody);

        if (response && response.player_id) {
            // Speichere die eigene Spieler-ID
            localStorage.setItem('player_id', response.player_id);
            window.location.href = `/game?game_id=${lobbyId}`;
        } else {
            alert('Failed to get player confirmation from server.');
        }
    }
    catch (error) {
        console.error('Failed to join lobby:', error);
        alert('Failed to join lobby. See console for details.');
    }
});