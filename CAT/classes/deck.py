import random
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


class Deck:
    """
    Manages the game's deck of cards, including creation, shuffling,
    and dealing hands to players.
    """

    def __init__(self):
        """Initializes a new deck, creates all cards, and shuffles them."""
        self.cards: List[Card] = []
        self.discard_pile: List[Card] = []
        self._create_deck()
        self.shuffle()

    def _create_deck(self):
        """
        Creates all 110 game cards by instantiating the specific card classes.
        The composition is based on the official game rules.
        """
        self.cards = []

        # 1. Standard numeric cards (8 of each)
        for value in [2, 3, 5, 6, 8, 9, 10, 12]:
            self.cards.extend([StandardCard(value)] * 8)

        # 2. Special cards
        # FlexCard (4 +/-): 8 cards
        self.cards.extend([FlexCard()] * 8)

        # InfernoCard (7): 8 cards
        self.cards.extend([InfernoCard()] * 8)

        # SwapCard: 8 cards
        self.cards.extend([SwapCard()] * 8)

        # "13/Start" Card: 8 cards
        self.cards.extend([
                              StartCard(
                                  name="13/Start",
                                  move_values=[13],
                                  description="Move a cat from the start area or move 13 fields forward."
                              )
                          ] * 8)

        # "1/11/Start" Card: 8 cards
        self.cards.extend([
                              StartCard(
                                  name="1/11/Start",
                                  move_values=[1, 11],
                                  description="Move a cat from the start area or move 1 or 11 fields forward."
                              )
                          ] * 8)

        # JokerCard: 6 cards
        self.cards.extend([JokerCard()] * 6)

        print(f"Deck created with {len(self.cards)} cards.")

    def shuffle(self):
        """
        Shuffles the main deck. If the deck is empty, it first
        reclaims the discard pile.
        """
        if not self.cards:
            print("Main deck is empty. Shuffling discard pile.")
            self.cards = self.discard_pile
            self.discard_pile = []

        random.shuffle(self.cards)
        print("Deck has been shuffled.")

    def deal_cards(self, players: List[Player], round_number: int):
        """
        Deals the correct number of cards to each player based on the round.
        The card count cycles from 6 down to 2.
        """
        # The number of cards decreases each round in a 5-round cycle (6, 5, 4, 3, 2)
        cards_to_deal = 6 - ((round_number - 1) % 5)

        print(f"Round {round_number}: Dealing {cards_to_deal} cards to each of {len(players)} players.")

        for i in range(cards_to_deal):
            for player in players:
                if not self.cards:
                    # Reshuffle if the deck runs out mid-deal
                    self.shuffle()

                # Pop a card from the deck and add it to the player's hand
                card = self.cards.pop()
                player.cards.append(card)

    def add_to_discard(self, card: Card):
        """Adds a played card to the discard pile."""
        self.discard_pile.append(card)