// Diese Klasse wird den Spielzustand für den Client verwalten.
class GameService {
    constructor() {
        this.gameState = null;
        this.localPlayerId = null;
    }

    // Speichert den neuesten Spielzustand und die ID des lokalen Spielers
    updateGameState(newState, playerId) {
        this.gameState = newState;
        this.localPlayerId = playerId;
        console.log("Client GameService updated:", this.gameState);
    }

    // Gibt alle Spieler zurück
    getPlayers() {
        return this.gameState ? this.gameState.players : [];
    }

    // Gibt den lokalen Spieler zurück
    getLocalPlayer() {
        if (!this.gameState || !this.localPlayerId) return null;
        // Da nur der lokale Spieler eine UUID hat, können wir danach suchen.
        return this.gameState.players.find(p => p.uuid === this.localPlayerId);
    }
    
    // Gibt die Handkarten des lokalen Spielers zurück
    getHand() {
        const player = this.getLocalPlayer();
        return player ? player.cards : [];
    }

    // BERECHNET das Startfeld für einen Spieler basierend auf seiner Nummer
    getStartFieldForPlayer(playerNumber) {
        return playerNumber * 14;
    }

    // BERECHNET das Endfeld für einen Spieler basierend auf seiner Nummer
    getFinishingFieldForPlayer(playerNumber) {
        const startField = this.getStartFieldForPlayer(playerNumber);
        // Die Modulo-Logik vom Server wird hier einfach nachgebaut
        return (startField - 1 + 54) % 54;
    }
}

// Erstelle eine einzige Instanz, die von allen anderen Skripten importiert werden kann
const gameService = new GameService();
export default gameService;