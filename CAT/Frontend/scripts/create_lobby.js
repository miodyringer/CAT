import sendRequest from './services/server_service.js'
import { translate } from './translator.mjs'
import getCookie from './functions.mjs'

const lobbyNameInput = document.querySelector('#lobby-name')
const playerNameInput = document.querySelector('#player-name')
const createLobbyBtn = document.querySelector('#create-lobby-btn')

/**
 * Handles the click event for the create lobby button.
 * Reads the lobby and player name, validates input, sends the create lobby request,
 * and redirects to the game page on success.
 *
 * @returns {Promise<void>} Resolves when the lobby creation process is complete.
 */
createLobbyBtn.addEventListener('click', async () => {
  const lobbyName = lobbyNameInput.value
  const playerName = playerNameInput.value

  if (!lobbyName || !playerName) {
    window.alert(translate(getCookie('language'), 'empty_lobby_or_player_alert'))
    return
  }

  const requestBody = {
    lobby_name: lobbyName,
    player_input: {
      player_name: playerName
    }
  }

  try {
    const response = await sendRequest('/lobby/create', 'POST', requestBody)

    if (response && response.game_id && response.player_id) {
      console.log('Lobby created:', response)
      window.location.href = `/game?game_id=${response.game_id}&player_id=${response.player_id}`
    } else {
      window.alert('Error creating lobby.')
    }
  } catch (error) {
    console.error('Failed to create lobby:', error)
    if (error.message.includes('Names cannot be longer than')) {
      const numberMatch = error.message.match(/\d+/)
      const maxLength = numberMatch ? numberMatch[0] : ''
      window.alert(translate(getCookie('language'), 'error_name_too_long').replace('{maxLength}', maxLength))
    } else {
      window.alert(translate(getCookie('language'), 'error_generic').replace('{errorMessage}', error.message))
    }
  }
})
