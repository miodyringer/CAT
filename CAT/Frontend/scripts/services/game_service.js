import { playSound } from '../audio_manager.mjs'

class GameService {
  constructor () {
    this.gameState = null
    this.localPlayerId = null
    this.selectedCardIndex = null
    this.selectedFigureId = null
    this.selectedTargetFigureId = null
    this.infernoMovePlan = []
    this.jokerImitation = null
  }

  isLocalPlayerTurn () {
    if (!this.gameState || !this.getLocalPlayer()) {
      return false
    }
    return this.gameState.current_player_index === this.getLocalPlayer().number
  }

  selectFigure (figureId) {
    let selectedCard = gameService.getHand()[this.selectedCardIndex]
    playSound('/audio/figure-select.mp3')
    if (selectedCard && selectedCard.type === 'JokerCard') {
      const jokerImitation = this.getJokerImitation()
      if (jokerImitation) {
        selectedCard = jokerImitation
      }
    }

    const isSwapActive = selectedCard && selectedCard.type === 'SwapCard'

    // --- Logic for the SwapCard ---
    if (isSwapActive) {
      const isOwnFigure = this.getLocalPlayer().figures.some(f => f.uuid === figureId)
      const figure = this.getFigureById(figureId)

      // Figure must be on the board
      if (!figure || figure.position < 0) return

      // 1st click: Select own figure.
      // This only happens if no main figure has been selected yet.
      if (!this.selectedFigureId && isOwnFigure) {
        this.selectedFigureId = figureId
        return
      }

      // 2nd click: Select target figure (must not be one's own).
        // This only happens if a main figure has already been selected.
        if (this.selectedFigureId && !isOwnFigure) {
        // Allow deselecting and reselecting the target figure
        this.selectedTargetFigureId = (this.selectedTargetFigureId === figureId) ? null : figureId
      }
      // Click on own figure to deselect it
      else if (this.selectedFigureId === figureId) {
        this.selectedFigureId = null
        this.selectedTargetFigureId = null // Also resets the target
      }
    }
    // --- Normal selection logic (for all other cards) ---
    else {
      this.selectedTargetFigureId = null // Always ensure that the swap selection is removed
      this.selectedFigureId = (this.selectedFigureId === figureId) ? null : figureId
    }
  }

  resetSelections () {
    this.selectedCardIndex = null
    this.selectedFigureId = null
    this.selectedTargetFigureId = null
    this.resetInfernoPlan()
    this.jokerImitation = null
  }

  getSelectedTargetFigureId () {
    return this.selectedTargetFigureId
  }

  getSelectedFigureId () {
    return this.selectedFigureId
  }

  selectCard (index) {
    // If the already selected card is clicked again, the selection is removed
    if (this.selectedCardIndex === index) {
      this.selectedCardIndex = null
    } else {
      this.selectedCardIndex = index
      if (this.getHand()[index].type === 'InfernoCard' || this.getHand()[index].type === 'JokerCard') {
        this.selectedFigureId = null
        this.selectedTargetFigureId = null
      }
    }
    playSound('/audio/card-select.mp3')
    console.log(`Selected card index: ${this.selectedCardIndex}`)
  }

  getSelectedCardIndex () {
    return this.selectedCardIndex
  }

  updateGameState (newState, playerId) {
    this.gameState = newState
    this.localPlayerId = playerId
    console.log('Client GameService updated:', this.gameState)
  }

  getPlayers () {
    return this.gameState ? this.gameState.players : []
  }

  getLocalPlayer () {
    if (!this.gameState || !this.localPlayerId) return null
    return this.gameState.players.find(p => p.uuid === this.localPlayerId)
  }

  getHand () {
    const player = this.getLocalPlayer()
    return player ? player.cards : []
  }

  getFigureById (figureId) {
    if (!this.gameState) return null
    for (const player of this.gameState.players) {
      const figure = player.figures.find(f => f.uuid === figureId)
      if (figure) {
        return figure
      }
    }
    return null
  }

  resetInfernoPlan () {
    this.infernoMovePlan = []
  }

  updateInfernoMove (figureId, steps) {
    // Remove the old entry for this figure, if present
    this.infernoMovePlan = this.infernoMovePlan.filter(move => move.figureId !== figureId)

    // Add the new move if steps > 0
    if (steps > 0) {
      this.infernoMovePlan.push({ figureId, steps })
    }
  }

  getInfernoMovePlan () {
    return this.infernoMovePlan
  }

  getInfernoPointsRemaining () {
    const totalAssignedPoints = this.infernoMovePlan.reduce((sum, move) => sum + move.steps, 0)
    return 7 - totalAssignedPoints
  }

  getStepsForFigure (figureId) {
    const move = this.infernoMovePlan.find(m => m.figureId === figureId)
    return move ? move.steps : 0
  }

  setJokerImitation (cardData) {
    this.jokerImitation = cardData
  }

  getJokerImitation () {
    return this.jokerImitation
  }
}

// Create a single instance that can be imported by all other scripts
const gameService = new GameService()
export default gameService
