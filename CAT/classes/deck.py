import random
import logging
from typing import List

from .cards import (
    Card,
    StandardCard,
    FlexCard,
    SwapCard,
    StartCard,
    InfernoCard,
    JokerCard
)
from .player import Player
from CAT.config import DECK_COMPOSITION, MAX_CARDS_DEALT, CARD_DEAL_CYCLE_LENGTH


class Deck():
    """
    Manages the game's deck of cards, including creation, shuffling,
    and dealing hands to players.
    """

    def __init__(self, game_id):
        """Initializes a new deck, creates all cards, and shuffles them."""
        self.cards: List[Card] = []
        self.discard_pile: List[Card] = []
        self.game_id = game_id
        self._create_deck()
        self.shuffle()

    def _create_deck(self):
        """
        Creates all game cards by instantiating the specific card classes.
        The composition is based on the settings in the config file.
        """
        self.cards = []

        for value in [2, 3, 5, 6, 8, 9, 10, 12]:
            self.cards.extend([StandardCard(value)] * DECK_COMPOSITION["standard_cards_each"])

        self.cards.extend([FlexCard()] * DECK_COMPOSITION["flex_cards"])

        self.cards.extend([InfernoCard()] * DECK_COMPOSITION["inferno_cards"])

        self.cards.extend([SwapCard()] * DECK_COMPOSITION["swap_cards"])

        self.cards.extend([
                              StartCard(
                                  name="13/Start",
                                  move_values=[13],
                                  description="Move a cat from the start area or move 13 fields forward."
                              )
                          ] * DECK_COMPOSITION["start_13_cards"])

        self.cards.extend([
                              StartCard(
                                  name="1/11/Start",
                                  move_values=[1, 11],
                                  description="Move a cat from the start area or move 1 or 11 fields forward."
                              )
                          ] * DECK_COMPOSITION["start_1_11_cards"])

        self.cards.extend([JokerCard()] * DECK_COMPOSITION["joker_cards"])

        logging.info(f"Deck created with {len(self.cards)} cards.", extra={'game_id': self.game_id})

    def shuffle(self):
        """
        Shuffles the main deck. If the deck is empty, it first
        reclaims the discard pile.
        """
        if not self.cards:
            logging.info("Main deck is empty. Shuffling discard pile.", extra={'game_id': self.game_id})
            self.cards = self.discard_pile
            self.discard_pile = []
            self.cards = self.discard_pile
            self.discard_pile = []

        random.shuffle(self.cards)
        logging.info("Deck has been shuffled.", extra={'game_id': self.game_id})

    def deal_cards(self, players: List[Player], round_number: int):
        """
        Deals the correct number of cards to each player based on the round.
        The card count cycles from 6 down to 2.
        """
        # The number of cards decreases each round in a 5-round cycle (6, 5, 4, 3, 2)
        cards_to_deal = MAX_CARDS_DEALT - ((round_number - 1) % CARD_DEAL_CYCLE_LENGTH)

        logging.info(f"Round {round_number}: Dealing {cards_to_deal} cards to each of {len(players)} players.", extra={'game_id': self.game_id})

        for i in range(cards_to_deal):
            for player in players:
                if not player.is_active:
                    continue
                if not self.cards:
                    # Reshuffle if the deck runs out mid-deal
                    self.shuffle()

                # Pop a card from the deck and add it to the player's hand
                card = self.cards.pop()
                player.cards.append(card)

    def add_to_discard(self, card: Card):
        """Adds a played card to the discard pile."""
        self.discard_pile.append(card)

    def to_json(self):
        """
        Converts the deck and discard pile to a JSON-compatible format.
        """
        return {
            "cards": [card.to_json() for card in self.cards],
            "discard_pile": [card.to_json() for card in self.discard_pile]
        }