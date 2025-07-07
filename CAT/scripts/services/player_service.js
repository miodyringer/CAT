// Auch hier werden die geschweiften Klammern entfernt (oder bleiben weg)
import sendRequest from "./server_service.js";

class PlayerService {

    static player = {
        uuid: "",
        name: "",
        lobby: ""
    }

    // Die Methode verwendet jetzt direkt die importierte Funktion "sendRequest"
    async playerLogin(name, lobby) {
        try {
            const response = await sendRequest("http://127.0.0.1:7777/player/login", "POST", {
                "name": name,
                "lobby": lobby
            });

            if (response && response.uuid) {
                PlayerService.player.uuid = response.uuid;
                PlayerService.player.name = response.name;
                PlayerService.player.lobby = response.lobby;
                console.log('Player logged in:', PlayerService.player);
            }
        } catch(error) {
            console.error('Player login failed:', error);
        }
    }
}

// Exportiere die Klasse, damit du sie in anderen Dateien verwenden kannst
export default PlayerService;