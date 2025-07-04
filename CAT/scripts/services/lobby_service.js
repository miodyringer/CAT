import sendRequest from "./server_service.js";

class LobbyService {

    getLobbies() {
        sendRequest("http://0.0.0.0/7777/lobby")
    }

}