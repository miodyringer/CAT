from __future__ import annotations
from abc import ABC, abstractmethod
import typing

if typing.TYPE_CHECKING:
    from .game import Game
    from .player import Player


class Card(ABC):
    """
    Abstract Base Class for all cards.
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    def play_card(self, game_object: Game, player: Player, **kwargs):
        raise NotImplementedError

    def __repr__(self):
        return f"Card({self.name})"

    def to_json(self):
        """Returns a JSON-serializable dictionary for the card."""
        return {
            "name": self.name,
            "description": self.description
        }


class StandardCard(Card):
    """A normal card that moves a figure forward by a fixed value."""

    def __init__(self, value: int):
        name = str(value)
        description = f"Move your figure {value} fields forward."
        super().__init__(name, description)
        self.value = value

    def play_card(self, game_object: Game, player: Player, **kwargs):
        figure_to_move = kwargs.get("figure")
        if not figure_to_move:
            raise ValueError("A figure to move must be selected.")
        game_object.move_figure(figure_to_move, self.value)

    def to_json(self):
        data = super().to_json()
        data['value'] = self.value
        return data


# ----------- SPECIAL CARDS START HERE -----------

class FlexCard(Card):
    """Flex Card (4 +/-): Moves 4 fields forward or backward."""

    def __init__(self):
        super().__init__("Flex Card", "Choose to move either forward or backward by 4.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        figure = kwargs.get("figure")
        direction = kwargs.get("direction")  # Frontend must send "forward" or "backward"

        if not figure or not direction:
            raise ValueError("A figure and a direction must be specified.")

        if direction == "forward":
            game_object.move_figure(figure, 4)
        elif direction == "backward":
            game_object.move_figure_backwards(figure, 4)
        else:
            raise ValueError("Invalid direction. Must be 'forward' or 'backward'.")

    def to_json(self):
        data = super().to_json()
        data['type'] = 'FlexCard'
        return data


class SwapCard(Card):
    """Swap Card: Swaps the positions of two figures on the board."""

    def __init__(self):
        super().__init__("Swap Card", "Choose one of your cats and swap its position with any other cat.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        own_figure = kwargs.get("own_figure")
        other_figure = kwargs.get("other_figure")

        if not own_figure or not other_figure:
            raise ValueError("Two figures must be selected to swap.")

        if own_figure.color != player.color:
            raise ValueError("You can only initiate a swap with one of your own figures.")

        game_object.swap_figures(own_figure, other_figure)

    def to_json(self):
        data = super().to_json()
        data['type'] = 'SwapCard'
        return data


class StartCard(Card):
    """
    Represents a card that can either start a figure or move it
    by one of several possible values (e.g., [1, 11] or [13]).
    """

    def __init__(self, name: str, move_values: list[int], description: str):
        super().__init__(name, description)
        self.move_values = move_values

    def play_card(self, game_object: Game, player: Player, **kwargs):
        """
        Plays the card by either starting a figure or moving it.
        The frontend must specify the chosen action and, if moving, the chosen value.
        """
        action = kwargs.get("action")  # Expected: "start" or "move"
        figure = kwargs.get("figure")

        if not action or not figure:
            raise ValueError("An action and a figure must be specified.")

        if action == "start":
            game_object.start_figure(player, figure)

        elif action == "move":
            chosen_value = kwargs.get("value")
            if chosen_value not in self.move_values:
                raise ValueError(f"Invalid move value. Must be one of {self.move_values}.")

            game_object.move_figure(figure, chosen_value)
        else:
            raise ValueError("Invalid action. Must be 'start' or 'move'.")

    def to_json(self):
        data = super().to_json()
        data['type'] = 'StartCard'
        data['move_values'] = self.move_values
        return data


class InfernoCard(Card):
    """Inferno Card (7): Can be split and 'burns' passed enemy figures."""

    def __init__(self):
        super().__init__("Inferno Card", "Split the value of 7 among your cats and burn any enemy cat it passes over.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        # This is the most complex card logic.
        # The frontend needs to send a list of moves, e.g.,
        # moves = [ {'figure': figure_A, 'steps': 3}, {'figure': figure_B, 'steps': 4} ]
        moves = kwargs.get("moves")

        if not isinstance(moves, list) or sum(move['steps'] for move in moves) != 7:
            raise ValueError("The moves must be a list and the steps must sum to 7.")

        # NOTE: The "burn" logic is an extension of a normal move.
        # You would need to create a special `move_and_burn` method in `game.py`
        # that checks for enemy figures on all tiles that are being passed over.
        for move in moves:
            game_object.move_and_burn(move['figure'], move['steps'])

    def to_json(self):
        data = super().to_json()
        data['type'] = 'InfernoCard'
        return data


class JokerCard(Card):
    """Joker Card: Can substitute for any other card."""

    def __init__(self):
        super().__init__("Joker Card", "Can be played as a substitute for any other card.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        # The Joker mimics another card.
        # The frontend must specify what card the Joker is being played as.
        card_to_imitate = kwargs.get("imitate_card_name")  # e.g., "Swap" or "7"

        if not card_to_imitate:
            raise ValueError("You must specify which card the Joker should imitate.")

        # Create a temporary instance of the target card and play it.
        if card_to_imitate == "Swap":
            imitated_card = SwapCard()
        elif card_to_imitate == "Flex":
            imitated_card = FlexCard()
        elif card_to_imitate == "Inferno":
            imitated_card = InfernoCard()
        elif card_to_imitate == "Start":
            # For StartCard, we need to specify the move values.
            # The frontend should send the move values as a list.
            move_values = kwargs.get("move_values")
            if move_values not in ([1, 11], [13]):
                raise ValueError("Only [1, 11] or [13] are allowed as move_values.")
            imitated_card = StartCard("Start Card", move_values, "Start a figure or move it by one of the specified values.")
        # ... add all other special card types here ...
        else:  # Handle standard number cards
            try:
                value = int(card_to_imitate)
                imitated_card = StandardCard(value)
            except ValueError:
                raise ValueError(f"Unknown card type to imitate: {card_to_imitate}")

        # Call the imitated card's play_card method with the same arguments.
        print(f"Playing Joker as a {card_to_imitate}...")
        imitated_card.play_card(game_object, player, **kwargs)

    def to_json(self):
        data = super().to_json()
        data['type'] = 'JokerCard'
        return data