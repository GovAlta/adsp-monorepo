from dataclasses import field
from typing import Set


class ParseContext:
    """
    Shared context for all XDP parsing operations.
    """

    def __init__(
        self,
        root=None,
        parent_map=None,
        radio_groups=None,
        help_text=None,
        jsonforms_rules=None,
    ):
        self.root = root
        self.parent_map = parent_map
        self.radio_groups = radio_groups or {}
        self.help_text = help_text or {}
        self.jsonforms_rules = jsonforms_rules or {}

    def get(self, key, default=None):
        # try instance attributes first
        if hasattr(self, key):
            return getattr(self, key)
        return default
