import sendRequest from './services/server_service.js'
import { translate } from './translator.mjs'
import getCookie from './functions.mjs'

const lobbyNameInput = document.querySelector('#lobby-name')
const playerNameInput = document.querySelector('#player-name')
const createLobbyBtn = document.querySelector('#create-lobby-btn')

createLobbyBtn.addEventListener('click', async () => {
  const lobbyName = lobbyNameInput.value
  const playerName = playerNameInput.value

  if (!lobbyName || !playerName) {
    window.alert(translate(getCookie('language'), 'empty_lobby_or_player_alert'))
    return
  }

  // Dieses Objekt muss genau der Struktur in CreateLobbyRequest entsprechen
  const requestBody = {
    lobby_name: lobbyName,
    player_input: {
      player_name: playerName
    }
  }

  try {
    const response = await sendRequest('/lobby/create', 'POST', requestBody)

    if (response && response.game_id && response.player_id) {
        console.log('Lobby created:', response);
        window.location.href = `/game?game_id=${response.game_id}&player_id=${response.player_id}`;
    } else {
        alert('Error creating lobby.');
    }
    } 
    catch (error) {
        console.error('Failed to create lobby:', error);
        if (error.message.includes('Names cannot be longer than')) {
            const numberMatch = error.message.match(/\d+/);
            const maxLength = numberMatch ? numberMatch[0] : '';
            alert(translate(getCookie("language"), "error_name_too_long").replace("{maxLength}", maxLength));
        }
        else {
            alert(translate(getCookie("language"), "error_generic").replace("{errorMessage}", error.message));
        }
    }
  } catch (error) {
    console.error('Failed to create lobby:', error)
    window.alert('Failed to connect to the server. Check the browser console (F12) for more details.')
  }
})
