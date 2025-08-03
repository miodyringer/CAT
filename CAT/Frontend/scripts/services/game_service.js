import { playSound } from '../audio_manager.mjs'

class GameService {
  /**
   * Initializes the GameService instance and its state variables.
   */
  constructor () {
    this.gameState = null
    this.localPlayerId = null
    this.selectedCardIndex = null
    this.selectedFigureId = null
    this.selectedTargetFigureId = null
    this.infernoMovePlan = []
    this.jokerImitation = null
  }

  /**
   * Checks if it is currently the local player's turn.
   * @returns {boolean} True if it is the local player's turn, false otherwise.
   */
  isLocalPlayerTurn () {
    if (!this.gameState || !this.getLocalPlayer()) {
      return false
    }
    return this.gameState.current_player_index === this.getLocalPlayer().number
  }

  /**
   * Handles the selection of a figure by the player, including logic for SwapCard and JokerCard.
   * @param {string} figureId - The UUID of the selected figure.
   */
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
        return // End the function here, wait for the next click.
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

  /**
   * Resets all selections (card, figure, target, inferno plan, joker imitation).
   */
  resetSelections () {
    this.selectedCardIndex = null
    this.selectedFigureId = null
    this.selectedTargetFigureId = null
    this.resetInfernoPlan()
    this.jokerImitation = null
  }

  /**
   * Gets the currently selected target figure ID (for SwapCard).
   * @returns {string|null} The UUID of the selected target figure, or null if none is selected.
   */
  getSelectedTargetFigureId () {
    return this.selectedTargetFigureId
  }

  /**
   * Gets the currently selected figure ID.
   * @returns {string|null} The UUID of the selected figure, or null if none is selected.
   */
  getSelectedFigureId () {
    return this.selectedFigureId
  }

  /**
   * Selects or deselects a card by its index.
   * @param {number} index - The index of the card to select or deselect.
   */
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

  /**
   * Gets the index of the currently selected card.
   * @returns {number|null} The index of the selected card, or null if none is selected.
   */
  getSelectedCardIndex () {
    return this.selectedCardIndex
  }

  /**
   * Updates the game state and local player ID.
   * @param {object} newState - The new game state object.
   * @param {string} playerId - The local player's UUID.
   */
  updateGameState (newState, playerId) {
    this.gameState = newState
    this.localPlayerId = playerId
    console.log('Client GameService updated:', this.gameState)
  }

  /**
   * Gets all players in the current game state.
   * @returns {Array} The list of player objects.
   */
  getPlayers () {
    return this.gameState ? this.gameState.players : []
  }

  /**
   * Gets the local player object.
   * @returns {object|null} The local player object, or null if not found.
   */
  getLocalPlayer () {
    if (!this.gameState || !this.localPlayerId) return null
    // Since only the local player has a UUID, we can search by that.
    return this.gameState.players.find(p => p.uuid === this.localPlayerId)
  }

  /**
   * Gets the hand cards of the local player.
   * @returns {Array} The list of card objects in the local player's hand.
   */
  getHand () {
    const player = this.getLocalPlayer()
    return player ? player.cards : []
  }

  /**
   * Gets a figure object by its UUID.
   * @param {string} figureId - The UUID of the figure.
   * @returns {object|null} The figure object, or null if not found.
   */
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

  /**
   * Resets the Inferno move plan.
   */
  resetInfernoPlan () {
    this.infernoMovePlan = []
  }

  /**
   * Updates the Inferno move plan for a specific figure.
   * @param {string} figureId - The UUID of the figure.
   * @param {number} steps - The number of steps to assign to the figure.
   */
  updateInfernoMove (figureId, steps) {
    // Remove the old entry for this figure, if present
    this.infernoMovePlan = this.infernoMovePlan.filter(move => move.figureId !== figureId)

    // Add the new move if steps > 0
    if (steps > 0) {
      this.infernoMovePlan.push({ figureId, steps })
    }
  }

  /**
   * Gets the current Inferno move plan.
   * @returns {Array} The list of moves for the Inferno card.
   */
  getInfernoMovePlan () {
    return this.infernoMovePlan
  }

  /**
   * Gets the number of Inferno points remaining to be assigned.
   * @returns {number} The number of points left to assign.
   */
  getInfernoPointsRemaining () {
    const totalAssignedPoints = this.infernoMovePlan.reduce((sum, move) => sum + move.steps, 0)
    return 7 - totalAssignedPoints
  }

  /**
   * Gets the number of steps assigned to a specific figure in the Inferno plan.
   * @param {string} figureId - The UUID of the figure.
   * @returns {number} The number of steps assigned to the figure.
   */
  getStepsForFigure (figureId) {
    const move = this.infernoMovePlan.find(m => m.figureId === figureId)
    return move ? move.steps : 0
  }

  /**
   * Sets the card data that the Joker card is imitating.
   * @param {object} cardData - The card data to imitate.
   */
  setJokerImitation (cardData) {
    this.jokerImitation = cardData
  }

  /**
   * Gets the card data that the Joker card is currently imitating.
   * @returns {object|null} The imitated card data, or null if none is set.
   */
  getJokerImitation () {
    return this.jokerImitation
  }
}

// Create a single instance that can be imported by all other scripts
const gameService = new GameService()
export default gameService
