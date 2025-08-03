import sendRequest from './services/server_service.js';
import {translate} from "./translator.mjs";
import getCookie from "./functions.mjs";

// Read parameters from the URL
const params = new URLSearchParams(document.location.search);
const lobbyId = params.get('lobbyId');
const lobbyName = params.get('lobbyName');

// Get HTML elements
const lobbyNameTitle = document.querySelector('#lobby-name');
const playerNameInput = document.querySelector('#player-name');
const joinGameBtn = document.querySelector('#join-game-btn');

// Display lobby name in the title
if (lobbyNameTitle && lobbyName) {
    lobbyNameTitle.textContent += ` "${lobbyName}"`;
}

joinGameBtn.addEventListener('click', async () => {
    const playerName = playerNameInput.value;

    if (!playerName) {
        alert(translate(getCookie("language"), "empty_player_name_alert"));
        return;
    }
    if (!lobbyId) {
        alert('Error: No Lobby ID found!');
        return;
    }

    const requestBody = {
        player_name: playerName
    };

    try {
        const response = await sendRequest(`/lobby/${lobbyId}/join`, 'POST', requestBody);

        if (response && response.player_id) {
            window.location.href = `/game?game_id=${lobbyId}&player_id=${response.player_id}`;
        } else {
            alert('Failed to get player confirmation from server.');
        }
    }
    catch (error) {
        console.error('Failed to join lobby:', error);
        if (error.message.includes('Names cannot be longer than')) {
            const numberMatch = error.message.match(/\d+/);
            const maxLength = numberMatch ? numberMatch[0] : '';
            alert(translate(getCookie("language"), "error_name_too_long").replace("{maxLength}", maxLength));
        }
        else {
            alert(translate(getCookie("language"), "error_generic").replace("{errorMessage}", error.message));
        }
    }
});