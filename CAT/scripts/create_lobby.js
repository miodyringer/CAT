import sendRequest from './services/server_service.js';

const lobbyNameInput = document.querySelector('#lobby-name');
const playerNameInput = document.querySelector('#player-name');
const createLobbyBtn = document.querySelector('#create-lobby-btn');

createLobbyBtn.addEventListener('click', async () => {
    const lobbyName = lobbyNameInput.value;
    const playerName = playerNameInput.value;

    if (!lobbyName || !playerName) {
        alert('Please enter a lobby and player name.');
        return;
    }

    // Dieses Objekt muss genau der Struktur in CreateLobbyRequest entsprechen
    const requestBody = {
        lobby_name: lobbyName,
        player_input: {
            player_name: playerName
        }
    };

    try {
    const response = await sendRequest(`/lobby/create`, 'POST', requestBody);

    if (response && response.game_id && response.player_id) {
        console.log('Lobby created:', response);
        // *** HIER DIE ÄNDERUNG: player_id zur URL hinzufügen ***
        window.location.href = `/game?game_id=${response.game_id}&player_id=${response.player_id}`;
    } else {
        alert('Error creating lobby.');
    }
    } 
    catch (error) {
        console.error('Failed to create lobby:', error);
        alert('Failed to connect to the server. Check the browser console (F12) for more details.');
    }
});