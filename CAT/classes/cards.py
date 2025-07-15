from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List
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
        """
        Abstract method to play the card.
        This method must be implemented by all subclasses.
        Args:
            game_object: The main `Game` instance containing the game logic.
            player: The `Player` who is playing the card.
            **kwargs: Additional arguments needed for the card action.
        Raises:
            NotImplementedError: If the method is not implemented in a subclass.
        """
        raise NotImplementedError

    def __repr__(self):
        return f"Card({self.name})"

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
        return {
            "name": self.name,
            "description": self.description
        }


class StandardCard(Card):
    """A normal card that moves a figure forward by a fixed value."""

    def __init__(self, value: int):
        if value < 1 or value > 13:
            raise ValueError("Value must be between 1 and 13.")
        name = str(value)
        description = f"Move your figure {value} fields forward."
        super().__init__(name, description)
        self.value = value

    def play_card(self, game_object: Game, player: Player, **kwargs):
        """
        Plays the card by moving a figure forward by the specified value.

            This method relies on the `kwargs` dictionary to receive the necessary
                details for the action.

                Args:
                    game_object: The main `Game` instance containing the game logic.
                    player: The `Player` who is playing the card.
                    **kwargs: A dictionary containing the action details.
                        Expected keys:
                        - 'figure_uuid' (str): The UUID of the figure to be moved.

                Raises:
                    ValueError: If 'figure_uuid' is missing from
                        kwargs, or if the no figure with 'figure_uuid' is found.
        """
        figure_uuid = kwargs.get("figure_uuid")
        if not figure_uuid:
            raise ValueError("A figure_uuid must be provided to play a StandardCard.")

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

        game_object.move_figure(figure_to_move, self.value)

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
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
        """
        Plays the Flex Card to move a figure 4 fields forward or backward.

                This method relies on the `kwargs` dictionary to receive the necessary
                details for the action.

                Args:
                    game_object: The main `Game` instance containing the game logic.
                    player: The `Player` who is playing the card.
                    **kwargs: A dictionary containing the action details.
                        Expected keys:
                        - 'figure_uuid' (str): The UUID of the figure to be moved.
                        - 'direction' (str): The direction of movement, either
                          'forward' or 'backward'.

                Raises:
                    ValueError: If 'figure_uuid' or 'direction' are missing from
                        kwargs, or if the direction is invalid.
        """
        figure_uuid = kwargs.get("figure_uuid")
        direction = kwargs.get("direction")

        if not figure_uuid or not direction:
            raise ValueError("A figure_uuid and a direction must be specified.")

        figure = game_object.get_figure_by_uuid(figure_uuid)
        if not figure:
            raise ValueError(f"Figure with UUID {figure_uuid} not found.")

        if direction == "forward":
            game_object.move_figure(figure, 4)
        elif direction == "backward":
            game_object.move_figure(figure, -4)
        else:
            raise ValueError("Invalid direction. Must be 'forward' or 'backward'.")

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
        data = super().to_json()
        data['type'] = 'FlexCard'
        return data


class SwapCard(Card):
    """
    Swap Card: Swaps the positions of two figures on the board.
    """

    def __init__(self):
        super().__init__("Swap Card", "Choose one of your cats and swap its position with any other cat.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        """
        Plays the Swap Card to swap the positions of two figures.

        This method relies on the `kwargs` dictionary to receive the necessary
                details for the action.

                Args:
                    game_object: The main `Game` instance containing the game logic.
                    player: The `Player` who is playing the card.
                    **kwargs: A dictionary containing the action details.
                        Expected keys:
                        - 'figure_uuid' (str): The UUID of the figure to be moved.
                        - 'other_figure_uuid' (str): The UUID of the other figure to swap with.


                Raises:
                    ValueError: If 'figure_uuid' or 'other_figure_uuid' are missing from
                        kwargs, or if the figures are not found in the game or figur1 is do not belong to the player.
        """
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

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
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

            This method relies on the `kwargs` dictionary to receive the necessary
                    details for the action.

                    Args:
                        game_object: The main `Game` instance containing the game logic.
                        player: The `Player` who is playing the card.
                        **kwargs: A dictionary containing the action details.
                            Expected keys:
                            - 'figure_uuid' (str): The UUID of the figure to be moved.
                            - 'action' (str): The action to perform, either 'start' or 'move'.
                                - 'value' (int): The value to move the figure by, if action is 'move'.

                    Raises:
                        ValueError: If 'figure_uuid' or
        """
        action = kwargs.get("action")
        figure_uuid = kwargs.get("figure_uuid")

        if not action or not figure_uuid:
            raise ValueError("An action and a figure_uuid must be specified.")

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

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
        data = super().to_json()
        data['type'] = 'StartCard'
        data['move_values'] = self.move_values
        return data


class InfernoCard(Card):
    """Inferno Card (7): Can be split and 'burns' passed enemy figures."""

    def __init__(self):
        super().__init__("Inferno Card", "Split the value of 7 among your cats and burn any enemy cat it passes over.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        """
        Plays the Inferno Card by moving figures and burning enemy figures.

            This method relies on the `kwargs` dictionary to receive the necessary
                details for the action.

                Args:
                    game_object: The main `Game` instance containing the game logic.
                    player: The `Player` who is playing the card.
                    **kwargs: A dictionary containing the action details.
                        Expected keys:
                        - 'moves' (list): A list of moves, each containing:
                            - 'figure_uuid' (str): The UUID of the figure to be moved.
                            - 'steps' (int): The number of steps to move the figure.

                Raises:
                    ValueError: If 'moves' are missing from kwargs,
                        or 'moves' is not a list, if the sum of steps is not 7,
                        or if any move is missing 'figure_uuid' or 'steps'.
        """

        def sort_moves_asc(moves : List[dict]) -> List[dict]:
            """
            Sorts the moves based on the position of the figures.
            This is necessary for the Inferno Card to ensure correct burning logic.

            Args:
                moves (list): A list of moves, each containing 'figure_uuid' and 'steps'.
            Returns:
                list: A sorted list of moves based on the position of the figures.
            """
            for i in range(len(moves)):
                for j in range(i + 1, len(moves)):
                    if game_object.get_figure_by_uuid(
                            moves[i].get("figure_uuid")).get_position() > game_object.get_figure_by_uuid(
                            moves[j].get("figure_uuid")).get_position():
                        moves[i], moves[j] = moves[j], moves[i]

            return moves

        def sort_figure_in_front_first(moves : List[dict]) -> List[dict]:
            """
            Sorts the moves based on the distance between the figures.
            This is necessary for the Inferno Card to ensure correct burning logic.

            Args:
                moves (list): A list of moves, each containing 'figure_uuid' and 'steps'.
            Returns:
                list: A sorted list of moves with the figure in front first.
            """
            if not moves:
                return moves

            imax = 0
            max_distance = 0

            for i, num in enumerate(moves):
                newmax = (game_object.get_figure_by_uuid(moves[(i + 1) % len(moves)].get("figure_uuid")).get_position() - game_object.get_figure_by_uuid(moves[i].get("figure_uuid")).get_position()) % 56
                if newmax > max_distance:
                    imax = i
                    max_distance = newmax

            moves = moves[(imax + 1) % len(moves):] + moves[:(imax + 1) % len(moves)]
            moves.reverse()
            return moves

        unsorted_moves = kwargs.get("moves")

        if not isinstance(unsorted_moves, list) or not unsorted_moves:
            raise ValueError("A list of moves must be provided for the Inferno Card.")

        if sum(move.get('steps') for move in unsorted_moves) != 7:
            raise ValueError("The steps of all moves for the Inferno Card must sum to 7.")


        sorted_moves = sort_moves_asc(unsorted_moves)

        moves = sort_figure_in_front_first(sorted_moves)


        for move in moves:
            figure_uuid = move.get("figure_uuid")
            steps = move.get("steps")

            if not figure_uuid or steps is None:
                raise ValueError("Each move must contain a 'figure_uuid' and 'steps'.")

            figure = game_object.get_figure_by_uuid(figure_uuid)

            if not figure or figure not in player.figures:
                raise ValueError(f"Invalid or non-own figure selected for Inferno move: {figure_uuid}")

            game_object.move_and_burn(figure, steps)

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
        data = super().to_json()
        data['type'] = 'InfernoCard'
        return data


class JokerCard(Card):
    """Joker Card: Can substitute for any other card."""

    def __init__(self):
        super().__init__("Joker Card", "Can be played as a substitute for any other card.")

    def play_card(self, game_object: Game, player: Player, **kwargs):
        """
        Plays the Joker Card by imitating another card's action.

            This method relies on the `kwargs` dictionary to receive the necessary
                details for the action.


                Args:
                    game_object: The main `Game` instance containing the game logic.
                    player: The `Player` who is playing the card.
                    **kwargs: A dictionary containing the action details.
                        Expected keys:
                        - 'imitate_card_name' (str): The UUID of the figure to be moved.
                        - '**kwargs': Additional arguments needed for the imitated card action.

                Raises:
                    ValueError: If 'imitate_card_name' is missing from kwargs, or if the card to imitate is unknown.
        """
        card_to_imitate = kwargs.get("imitate_card_name")

        if not card_to_imitate:
            raise ValueError("You must specify which card the Joker should imitate.")

        if card_to_imitate == "Swap Card":
            imitated_card = SwapCard()
        elif card_to_imitate == "Flex Card":
            imitated_card = FlexCard()
        elif card_to_imitate == "Inferno Card":
            imitated_card = InfernoCard()
        elif card_to_imitate == "Start":
            move_values = kwargs.get("move_values")
            if move_values not in ([1, 11], [13]):
                raise ValueError("Only [1, 11] or [13] are allowed as move_values.")
            imitated_card = StartCard("Start Card", move_values, "Start a figure or move it by one of the specified values.")
        else:
            try:
                value = int(card_to_imitate)
                imitated_card = StandardCard(value)
            except ValueError:
                raise ValueError(f"Unknown card type to imitate: {card_to_imitate}")

        print(f"Playing Joker as a {card_to_imitate}")
        imitated_card.play_card(game_object, player, **kwargs)

    def to_json(self) -> dict:
        """
        Returns a JSON-serializable dictionary for the card.
        """
        data = super().to_json()
        data['type'] = 'JokerCard'
        return data