from typing import Optional


class DisplayText:
    def __init__(
        self,
        label: str,
        description: Optional[str] = None,
    ):
        self.label = label
        self.description = description

    def add_description(self, description: str):
        self.description = description
