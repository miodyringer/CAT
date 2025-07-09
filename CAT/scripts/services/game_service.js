class GameService {
    constructor() {
        this.gameState = null;
        this.localPlayerId = null;
        this.selectedCardIndex = null;
        this.selectedFigureId = null;
        this.selectedTargetFigureId = null;
    }

    isLocalPlayerTurn() {
        if (!this.gameState || !this.getLocalPlayer()) {
            return false;
        }
        return this.gameState.current_player_index === this.getLocalPlayer().number;
    }

    selectFigure(figureId) {
        const selectedCard = this.getHand()[this.selectedCardIndex];

        // Wenn keine Tauschkarte ausgewählt ist, verhält es sich wie bisher
        if (!selectedCard || selectedCard.type !== 'SwapCard') {
            if (this.selectedFigureId === figureId) {
                this.selectedFigureId = null;
            } else {
                this.selectedFigureId = figureId;
            }
            this.selectedTargetFigureId = null; // Auswahl zurücksetzen
            return;
        }

        // --- Logik für die Tauschkarte ---
        const localPlayer = this.getLocalPlayer();
        const isOwnFigure = localPlayer.figures.some(f => f.uuid === figureId);

        // 1. Klick: Wählt die EIGENE Figur aus
        if (!this.selectedFigureId && isOwnFigure) {
            this.selectedFigureId = figureId;
        }
        // 2. Klick: Wählt die ZIEL-Figur aus (darf nicht dieselbe sein)
        else if (this.selectedFigureId && this.selectedFigureId !== figureId) {
             if (this.selectedTargetFigureId === figureId) {
                this.selectedTargetFigureId = null; // Auswahl der Zielfigur aufheben
            } else {
                this.selectedTargetFigureId = figureId;
            }
        }
    }

    // Setzt alle Auswahlen zurück
    resetSelections() {
        this.selectedCardIndex = null;
        this.selectedFigureId = null;
        this.selectedTargetFigureId = null;
    }

    // Getter für die Zielfigur
    getSelectedTargetFigureId() {
        return this.selectedTargetFigureId;
    }

    getSelectedFigureId() {
        return this.selectedFigureId;
    }

    // Wählt eine Karte aus oder ab
    selectCard(index) {
        // Wenn die bereits ausgewählte Karte erneut geklickt wird, wird die Auswahl aufgehoben
        if (this.selectedCardIndex === index) {
            this.selectedCardIndex = null;
        } else {
            this.selectedCardIndex = index;
        }
        console.log(`Selected card index: ${this.selectedCardIndex}`);
    }

    // Gibt den Index der ausgewählten Karte zurück
    getSelectedCardIndex() {
        return this.selectedCardIndex;
    }
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