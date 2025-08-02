import sendRequest from './services/server_service.js'

// 1. Parameter aus der URL auslesen
const params = new URLSearchParams(document.location.search)
const lobbyId = params.get('lobbyId')
const lobbyName = params.get('lobbyName')

// 2. HTML-Elemente holen
const lobbyNameTitle = document.querySelector('#lobby-name')
const playerNameInput = document.querySelector('#player-name')
const joinGameBtn = document.querySelector('#join-game-btn')

// Lobby-Namen im Titel anzeigen
if (lobbyNameTitle && lobbyName) {
  lobbyNameTitle.textContent += ` "${lobbyName}"`
}

// 3. Klick-Listener für den Join-Button hinzufügen
joinGameBtn.addEventListener('click', async () => {
  const playerName = playerNameInput.value

  if (!playerName) {
    window.alert('Please enter a player name.')
    return
  }
  if (!lobbyId) {
    window.alert('Error: No Lobby ID found!')
    return
  }

  // 4. Daten für die API-Anfrage vorbereiten
  const requestBody = {
    player_name: playerName
  }

  try {
    const response = await sendRequest(`/lobby/${lobbyId}/join`, 'POST', requestBody)

    if (response && response.player_id) {
      // *** HIER DIE ÄNDERUNG: player_id zur URL hinzufügen ***
      window.location.href = `/game?game_id=${lobbyId}&player_id=${response.player_id}`
    } else {
      window.alert('Failed to get player confirmation from server.')
    }
  } catch (error) {
    console.error('Failed to join lobby:', error)
    window.alert('Failed to join lobby. See console for details.')
  }
})
