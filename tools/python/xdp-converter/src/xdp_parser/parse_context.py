from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Set


@dataclass
class ParseContext:

    # Required for both passes
    root: Any
    parent_map: Dict[Any, Any]
    radio_groups: Dict[str, list]

    # Only needed after visibility pipeline
    help_text: Optional[Dict[str, str]] = None
    jsonforms_rules: Optional[Dict[str, Any]] = None

    # Populated inside parse_xdp() during the *final* pass
    top_subforms: Optional[Set[int]] = None

    def get(self, key, default=None):
        """Support existing call sites (to avoid churn)."""
        return getattr(self, key, default)
