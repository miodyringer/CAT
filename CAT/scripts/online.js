const lobbies = [];

function getLobbies() {
    for (let i = 0; i < 4; i++) {
        lobbies.push({"name": "lobby", "players": "3", "lobbyId" : i});
    }
}

function joinLobby(lobbyId, lobbyName) {
    window.location.href = "./join_lobby.html?lobbyId=" + lobbyId + "&lobbyName=" + lobbyName;
}

getLobbies();

const lobbyList = document.querySelector("#lobby-list");

lobbies.forEach(lobby => {
    const lobbyItem = document.createElement("div");
    lobbyItem.className = "lobby-item";
    const lobbyDetails = document.createElement("div");
    lobbyDetails.className = "lobby-details";
    const lobbyName = document.createElement("h3");
    lobbyName.textContent = lobby.name;
    lobbyName.className = "lobby-name";
    const lobbyPlayers = document.createElement("p");
    lobbyPlayers.textContent = "Players: " + lobby.players + "/4";
    lobbyPlayers.className = "lobby-players";
    const button = document.createElement("button");
    button.textContent = "Join Lobby";
    button.className = "button green";
    button.onclick = function(){joinLobby(lobby.lobbyId, lobby.name)};
    lobbyDetails.appendChild(lobbyName);
    lobbyDetails.appendChild(lobbyPlayers);
    lobbyItem.appendChild(lobbyDetails);
    lobbyItem.appendChild(button);
    lobbyList.appendChild(lobbyItem);
});

