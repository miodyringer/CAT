let params = new URLSearchParams(document.location.search);
let id = params.get('lobbyId');
let name = params.get('lobbyName');

const lobbyName = document.querySelector('#lobby-name');
lobbyName.textContent += '"' + name + '"';