import sendRequest from './services/server_service.js';

// Verknüpfung zur join_lobby.html-Seite
function joinLobby(lobbyId, lobbyName) {
    window.location.href = `./join_lobby?lobbyId=${lobbyId}&lobbyName=${lobbyName}`;
}

// Funktion zum Rendern der Lobbys
function renderLobbies(lobbies) {
    const lobbyListContainer = document.querySelector("#lobby-list");
    lobbyListContainer.innerHTML = ''; // Leere die Liste vor dem Neuzeichnen

    // Das Backend gibt ein Objekt zurück, wir iterieren über die Werte (die Game-Objekte)
    for (const game of Object.values(lobbies)) {
        const lobbyItem = document.createElement("div");
        lobbyItem.className = "lobby-item";

        const lobbyDetails = document.createElement("div");
        lobbyDetails.className = "lobby-details";

        const lobbyName = document.createElement("h3");
        lobbyName.textContent = game.name;
        lobbyName.className = "lobby-name";

        const lobbyPlayers = document.createElement("p");
        lobbyPlayers.textContent = `Players: ${game.number_of_players}/4`;
        lobbyPlayers.className = "lobby-players";

        const button = document.createElement("button");
        button.textContent = "Join Lobby";
        button.className = "button green";
        // Wir übergeben die game.uuid und den game.name an die joinLobby-Funktion
        button.onclick = () => joinLobby(game.uuid, game.name);

        lobbyDetails.appendChild(lobbyName);
        lobbyDetails.appendChild(lobbyPlayers);
        lobbyItem.appendChild(lobbyDetails);
        lobbyItem.appendChild(button);
        lobbyListContainer.appendChild(lobbyItem);
    }
}

// Hauptfunktion zum Laden der Lobbys
async function fetchAndDisplayLobbies() {
    try {
        const lobbies = await sendRequest('http://127.0.0.1:7777/lobby/list');
        renderLobbies(lobbies);
    } catch (error) {
        console.error("Failed to fetch lobbies:", error);
        // Optional: eine Fehlermeldung auf der Seite anzeigen
    }
}

// 1. Finde den Refresh-Button im HTML
const refreshButton = document.querySelector("#refresh-lobbies-button");

// 2. Füge einen Event-Listener für Klicks hinzu
if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        // 3. Rufe einfach die existierende Funktion erneut auf
        fetchAndDisplayLobbies();
    });
}
// *** ENDE NEUER CODE-BLOCK ***

// Führe die Funktion aus, wenn die Seite geladen wird
document.addEventListener('DOMContentLoaded', fetchAndDisplayLobbies);

