import sendRequest from "./server_service.js";

class PlayerService {

    static player = {
        uuid: "",
        name: "",
        lobby: ""
    }

    playerLogin(name, lobby) {
        sendRequest("http://0.0.0.0:7777/player/login", "POST", {
            "name": name,
            "lobby": lobby
        }).then(r => {
            if (r.status === 200) {
                PlayerService.player.uuid = r.uuid;
                PlayerService.player.name = r.name;
                PlayerService.player.lobby = r.lobby;
            }
        });
    }

}