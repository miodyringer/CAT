import {playSound} from "../audio_manager.mjs";

class GameService {
    constructor() {
        this.gameState = null;
        this.localPlayerId = null;
        this.selectedCardIndex = null;
        this.selectedFigureId = null;
        this.selectedTargetFigureId = null;
        this.infernoMovePlan = [];
        this.jokerImitation = null;
    }

    isLocalPlayerTurn() {
        if (!this.gameState || !this.getLocalPlayer()) {
            return false;
        }
        return this.gameState.current_player_index === this.getLocalPlayer().number;
    }

    selectFigure(figureId) {
        let selectedCard = gameService.getHand()[this.selectedCardIndex];
        playSound("/audio/figure-select.mp3");
        // Prüfen, ob ein Joker eine SwapCard imitiert
        if (selectedCard && selectedCard.type === 'JokerCard') {
            const jokerImitation = this.getJokerImitation();
            if (jokerImitation) {
                selectedCard = jokerImitation;
            }
        }

        const isSwapActive = selectedCard && selectedCard.type === 'SwapCard';

        // --- Logik für die Tauschkarte ---
        if (isSwapActive) {
            const isOwnFigure = this.getLocalPlayer().figures.some(f => f.uuid === figureId);
            const figure = this.getFigureById(figureId);

            // Figur muss auf dem Brett sein
            if (!figure || figure.position < 0) return;

            // 1. Klick: Auswahl der EIGENEN Figur.
            // Dies passiert nur, wenn noch keine Hauptfigur ausgewählt ist.
            if (!this.selectedFigureId && isOwnFigure) {
                this.selectedFigureId = figureId;
                return; // Beende die Funktion hier, warte auf den nächsten Klick.
            }

            // 2. Klick: Auswahl der ZIEL-Figur (darf nicht die eigene sein).
            // Dies passiert nur, wenn bereits eine Hauptfigur ausgewählt ist.
            if (this.selectedFigureId && !isOwnFigure) {
                // Erlaube das Ab- und Anwählen der Zielfigur
                this.selectedTargetFigureId = (this.selectedTargetFigureId === figureId) ? null : figureId;
            }
             // Klick auf die eigene Figur, um sie abzuwählen
            else if (this.selectedFigureId === figureId) {
                this.selectedFigureId = null;
                this.selectedTargetFigureId = null; // Setzt auch das Ziel zurück
            }
        }
        // --- Normale Auswahl-Logik (für alle anderen Karten) ---
        else {
            this.selectedTargetFigureId = null; // Immer sicherstellen, dass die Tauschauswahl weg ist
            this.selectedFigureId = (this.selectedFigureId === figureId) ? null : figureId;
        }
    }

    // Setzt alle Auswahlen zurück
    resetSelections() {
        this.selectedCardIndex = null;
        this.selectedFigureId = null;
        this.selectedTargetFigureId = null;
        this.resetInfernoPlan();
        this.jokerImitation = null;
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
            if(this.getHand()[index].type === "InfernoCard" || this.getHand()[index].type === "JokerCard"){
                this.selectedFigureId = null;
                this.selectedTargetFigureId = null;
            }
        }
        playSound("/audio/card-select.mp3");
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

    getFigureById(figureId) {
        if (!this.gameState) return null;
        for (const player of this.gameState.players) {
            const figure = player.figures.find(f => f.uuid === figureId);
            if (figure) {
                return figure;
            }
        }
        return null;
    }

    resetInfernoPlan() {
        this.infernoMovePlan = [];
    }

    updateInfernoMove(figureId, steps) {
        // Entferne den alten Eintrag für diese Figur, falls vorhanden
        this.infernoMovePlan = this.infernoMovePlan.filter(move => move.figureId !== figureId);

        // Füge den neuen Zug hinzu, wenn die Schritte > 0 sind
        if (steps > 0) {
            this.infernoMovePlan.push({ figureId: figureId, steps: steps });
        }
    }

    getInfernoMovePlan() {
        return this.infernoMovePlan;
    }

    getInfernoPointsRemaining() {
        const totalAssignedPoints = this.infernoMovePlan.reduce((sum, move) => sum + move.steps, 0);
        return 7 - totalAssignedPoints;
    }

    getStepsForFigure(figureId) {
        const move = this.infernoMovePlan.find(m => m.figureId === figureId);
        return move ? move.steps : 0;
    }

    setJokerImitation(cardData) {
        this.jokerImitation = cardData;
    }

    getJokerImitation() {
        return this.jokerImitation;
    }




}

// Erstelle eine einzige Instanz, die von allen anderen Skripten importiert werden kann
const gameService = new GameService();
export default gameService;