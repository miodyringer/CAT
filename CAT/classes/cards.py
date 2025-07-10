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
        # Holt die UUID der Figur aus den Argumenten
        figure_uuid = kwargs.get("figure_uuid")
        if not figure_uuid:
            raise ValueError("A figure_uuid must be provided to play a StandardCard.")

        # Findet das passende Figur-Objekt im Spiel
        figure_to_move = None
        for p in game_object.players:
            for fig in p.figures:
                if fig.uuid == figure_uuid:
                    figure_to_move = fig
                    break
            if figure_to_move:
                break

        if not figure_to_move:
            raise ValueError(f"Figure with UUID {figure_uuid} not found in the game.")

        # Führt die Bewegung mit dem gefundenen Objekt aus
        game_object.move_figure(figure_to_move, self.value)

    def to_json(self):
        data = super().to_json()
        data['value'] = self.value
        data['type'] = 'StandardCard'
        return data


# ----------- SPECIAL CARDS START HERE -----------

class FlexCard(Card):
    """Flex Card (4 +/-): Moves 4 fields forward or backward."""

    def __init__(self):
        super().__init__("Flex Card", "Choose to move either forward or backward by 4.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        figure_uuid = kwargs.get("figure_uuid")
        direction = kwargs.get("direction")  # Das Frontend muss "forward" oder "backward" senden

        if not figure_uuid or not direction:
            raise ValueError("A figure_uuid and a direction must be specified.")

        # Finde das passende Figur-Objekt im Spiel
        figure = game_object.get_figure_by_uuid(figure_uuid)
        if not figure:
            raise ValueError(f"Figure with UUID {figure_uuid} not found.")

        if direction == "forward":
            game_object.move_figure(figure, 4)
        elif direction == "backward":
            game_object.move_figure(figure, -4)
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
        own_figure_uuid = kwargs.get("figure_uuid")
        other_figure_uuid = kwargs.get("other_figure_uuid")

        if not own_figure_uuid or not other_figure_uuid:
            raise ValueError("Two figure UUIDs must be provided for a swap.")

        figure1 = game_object.get_figure_by_uuid(own_figure_uuid)
        figure2 = game_object.get_figure_by_uuid(other_figure_uuid)

        if not figure1 or not figure2:
            raise ValueError("One or both figures for the swap not found.")

        if figure1 not in player.figures:
            raise ValueError("You can only initiate a swap with one of your own figures.")

        game_object.swap_figures(figure1, figure2)

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
        """
        action = kwargs.get("action")
        figure_uuid = kwargs.get("figure_uuid") # Wir bekommen die UUID

        if not action or not figure_uuid:
            raise ValueError("An action and a figure_uuid must be specified.")

        # Finde die Figur basierend auf der UUID
        figure = game_object.get_figure_by_uuid(figure_uuid)

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
        moves = kwargs.get("moves")

        if not isinstance(moves, list) or not moves:
            raise ValueError("A list of moves must be provided for the Inferno Card.")

        # Prüft, ob die Summe der Schritte exakt 7 ist
        if sum(move.get('steps', 0) for move in moves) != 7:
            raise ValueError("The steps of all moves for the Inferno Card must sum to 7.")

        # Führe jeden einzelnen Zug aus dem "Bauplan" aus
        for move in moves:
            figure_uuid = move.get("figure_uuid")
            steps = move.get("steps")

            if not figure_uuid or steps is None:
                raise ValueError("Each move must contain a 'figure_uuid' and 'steps'.")

            # Finde die Figur im Spiel, die bewegt werden soll
            figure = game_object.get_figure_by_uuid(figure_uuid)

            # Stelle sicher, dass die Figur existiert und dem Spieler gehört
            if not figure or figure not in player.figures:
                raise ValueError(f"Invalid or non-own figure selected for Inferno move: {figure_uuid}")

            # Rufe die spezielle Methode zum Bewegen und Verbrennen auf
            game_object.move_and_burn(figure, steps)

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
        if card_to_imitate == "Swap Card":
            imitated_card = SwapCard()
        elif card_to_imitate == "Flex Card":
            imitated_card = FlexCard()
        elif card_to_imitate == "Inferno Card":
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