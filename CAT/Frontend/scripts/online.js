import sendRequest from './services/server_service.js';
import {translate} from "./translator.mjs";
import getCookie from "./functions.mjs";

// Eine globale Variable, um die ungefilterte Liste aller Lobbys zu speichern
let allLobbies = {};

// --- Die renderLobbies und joinLobby Funktionen bleiben fast gleich ---

function joinLobby(lobbyId, lobbyName) {
    window.location.href = `./join_lobby?lobbyId=${lobbyId}&lobbyName=${lobbyName}`;
}

function renderLobbies(lobbiesToRender) {
    const lobbyListContainer = document.querySelector("#lobby-list");
    lobbyListContainer.innerHTML = '';

    // Jetzt wird die Funktion mit einer möglicherweise gefilterten Liste aufgerufen
    for (const game of Object.values(lobbiesToRender)) {
        const lobbyItem = document.createElement("div");
        lobbyItem.className = "lobby-item";

        const lobbyDetails = document.createElement("div");
        lobbyDetails.className = "lobby-details";

        const lobbyName = document.createElement("h3");
        lobbyName.textContent = game.name;
        lobbyName.className = "lobby-name";

        const lobbyPlayers = document.createElement("p");
        lobbyPlayers.textContent = `${translate(getCookie("language"), "players")}: ${game.number_of_players}/4`;
        lobbyPlayers.className = "lobby-players";

        const button = document.createElement("a");
        button.textContent = translate(getCookie("language"), "join_lobby_button");
        button.className = "button green";
        button.onclick = () => joinLobby(game.uuid, game.name);

        lobbyDetails.appendChild(lobbyName);
        lobbyDetails.appendChild(lobbyPlayers);
        lobbyItem.appendChild(lobbyDetails);
        lobbyItem.appendChild(button);
        lobbyListContainer.appendChild(lobbyItem);
    }
}

// NEUE FUNKTION: Diese Funktion filtert und rendert die Lobbys
function filterAndRender() {
    // 1. Hole die aktuellen Filterwerte
    const nameFilterValue = document.querySelector("#lobby-name-filter").value.toLowerCase();
    const minPlayersValue = document.querySelector('input[name="players"]:checked').value;

    // 2. Filtere die Lobbys
    const filteredLobbies = Object.values(allLobbies).filter(game => {
        const nameMatch = game.name.toLowerCase().includes(nameFilterValue);
        const playersMatch = game.number_of_players >= parseInt(minPlayersValue);
        return nameMatch && playersMatch;
    });

    // 3. Konvertiere das gefilterte Array zurück in ein Objekt, damit renderLobbies es verarbeiten kann
    const filteredLobbiesObject = filteredLobbies.reduce((obj, game) => {
        obj[game.uuid] = game;
        return obj;
    }, {});

    // 4. Rufe die Render-Funktion mit der gefilterten Liste auf
    renderLobbies(filteredLobbiesObject);
}


// Hauptfunktion zum Laden der Lobbys
async function fetchAndDisplayLobbies() {
    try {
        allLobbies = await sendRequest('/lobby/list');
        // Zeige die Lobbys initial an (ungefiltert)
        filterAndRender();
    } catch (error) {
        console.error("Failed to fetch lobbies:", error);
    }
}

// Event-Listener, wenn die Seite geladen ist
document.addEventListener('DOMContentLoaded', () => {
    // Lade die Lobbys beim ersten Mal
    fetchAndDisplayLobbies();

    // Füge Event-Listener zu den Filter-Inputs hinzu
    const nameFilterInput = document.querySelector("#lobby-name-filter");
    nameFilterInput.addEventListener('input', filterAndRender);

    const playerFilterRadios = document.querySelectorAll('input[name="players"]');
    playerFilterRadios.forEach(radio => {
        radio.addEventListener('change', filterAndRender);
    });

    // Dein Refresh-Button ruft jetzt auch die fetch-Funktion auf, was korrekt ist
    const refreshButton = document.querySelector("#refresh-lobbies-button");
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchAndDisplayLobbies);
    }
});