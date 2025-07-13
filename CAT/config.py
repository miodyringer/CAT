# ==================================
# GAME CONFIGURATION FOR CAT
# ==================================

# ==================================
# GENERELL GAME SETTINGS
# ==================================
NUMBER_OF_FIELDS = 56 # shouldn't be changed
FIGURES_PER_PLAYER = 4 # max 4 figures per player are allowed
MAX_PLAYERS = 4 # max 4 players are allowed
MIN_PLAYERS_TO_START = 2

# ==================================
# GAMEPLAY
# ==================================
TURN_DURATION = 20
GAME_INACTIVITY_TIMEOUT = 180

# Card Cycle: Starts with 6 cards, cycle length is 5 rounds (6, 5, 4, 3, 2)
MAX_CARDS_DEALT = 6
CARD_DEAL_CYCLE_LENGTH = 5

# ==================================
# DECK-COMPOSITION
# ==================================
DECK_COMPOSITION = {
    "standard_cards_each": 8,
    "flex_cards": 8,
    "inferno_cards": 8,
    "swap_cards": 8,
    "start_13_cards": 8,
    "start_1_11_cards": 8,
    "joker_cards": 6
}