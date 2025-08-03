import sendRequest from './services/server_service.js'
import { translate } from './translator.mjs'
import getCookie from './functions.mjs'

// A global variable to store the unfiltered list of all lobbies
let allLobbies = {}

function joinLobby (lobbyId, lobbyName) {
  window.location.href = `./join_lobby?lobbyId=${lobbyId}&lobbyName=${lobbyName}`
}

function renderLobbies (lobbiesToRender) {
  const lobbyListContainer = document.querySelector('#lobby-list')
  lobbyListContainer.innerHTML = ''

  for (const game of Object.values(lobbiesToRender)) {
    const lobbyItem = document.createElement('div')
    lobbyItem.className = 'lobby-item'

    const lobbyDetails = document.createElement('div')
    lobbyDetails.className = 'lobby-details'

    const lobbyName = document.createElement('h3')
    lobbyName.textContent = game.name
    lobbyName.className = 'lobby-name'

    const lobbyPlayers = document.createElement('p')
    lobbyPlayers.textContent = `${translate(getCookie('language'), 'players')}: ${game.number_of_players}/4`
    lobbyPlayers.className = 'lobby-players'

    const button = document.createElement('a')
    button.textContent = translate(getCookie('language'), 'join_lobby_button')
    button.className = 'button green'
    button.onclick = () => joinLobby(game.uuid, game.name)

    lobbyDetails.appendChild(lobbyName)
    lobbyDetails.appendChild(lobbyPlayers)
    lobbyItem.appendChild(lobbyDetails)
    lobbyItem.appendChild(button)
    lobbyListContainer.appendChild(lobbyItem)
  }
}

function filterAndRender () {
  const nameFilterValue = document.querySelector('#lobby-name-filter').value.toLowerCase()
  const minPlayersValue = document.querySelector('input[name="players"]:checked').value

  const filteredLobbies = Object.values(allLobbies).filter(game => {
    const nameMatch = game.name.toLowerCase().includes(nameFilterValue)
    const playersMatch = game.number_of_players >= parseInt(minPlayersValue)
    return nameMatch && playersMatch
  })

  const filteredLobbiesObject = filteredLobbies.reduce((obj, game) => {
    obj[game.uuid] = game
    return obj
  }, {})

  renderLobbies(filteredLobbiesObject)
}

async function fetchAndDisplayLobbies () {
  try {
    allLobbies = await sendRequest('/lobby/list')
    filterAndRender()
  } catch (error) {
    console.error('Failed to fetch lobbies:', error)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplayLobbies()

  const nameFilterInput = document.querySelector('#lobby-name-filter')
  nameFilterInput.addEventListener('input', filterAndRender)

  const playerFilterRadios = document.querySelectorAll('input[name="players"]')
  playerFilterRadios.forEach(radio => {
    radio.addEventListener('change', filterAndRender)
  })

  const refreshButton = document.querySelector('#refresh-lobbies-button')
  if (refreshButton) {
    refreshButton.addEventListener('click', fetchAndDisplayLobbies)
  }
})