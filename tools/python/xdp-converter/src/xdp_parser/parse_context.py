from dataclasses import dataclass
from typing import Any, Dict, Optional
import xml.etree.ElementTree as ET


@dataclass
class ParseContext:
    """
    Shared context for all XDP parsing operations.
    """

    root: Optional[ET.Element] = None
    parent_map: Optional[Dict[ET.Element, ET.Element]] = None
    visibility_rules: Optional[Dict[str, list[dict]]] = None
    help_text: Optional[Dict[str, str]] = None
    extra: Optional[Dict[str, Any]] = None  # for anything transient or stage-specific

    def get(self, key: str, default=None):
        """Convenience for safe lookups."""
        return getattr(self, key, self.extra.get(key) if self.extra else default)
