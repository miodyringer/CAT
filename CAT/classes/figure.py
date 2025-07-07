import uuid

class Figure():
    def __init__(self, color: str):
        self.uuid = str(uuid.uuid4())
        self.color = color
        self.position = -1

    def get_position(self) -> int:
        return self.position

    def get_color(self) -> str:
        return self.color

    def get_uuid(self) -> str:
        return self.uuid