import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Dict, Optional, Set

from visibility_rules.stages.context_types import JsonFormsRule, JsonFormsRuleEntry


@dataclass
class ParseContext:

    # Required for both passes
    root: ET.Element
    parent_map: Dict[ET.Element, Optional[ET.Element]]
    radio_groups: Dict[str, list]

    # Only needed after visibility pipeline
    help_text: Optional[Dict[str, str]] = None
    jsonforms_rules: dict[str, JsonFormsRuleEntry] = field(default_factory=dict)

    # Populated inside parse_xdp() during the *final* pass
    top_subforms: Optional[Set[int]] = None

    def get_root(self) -> ET.Element:
        return self.root

    def get_parent_map(self) -> Dict[ET.Element, Optional[ET.Element]]:
        return self.parent_map

    def get_radio_groups(self) -> Dict[str, list]:
        return self.radio_groups

    def get_jsonforms_rules(self) -> dict[str, JsonFormsRuleEntry]:
        return self.jsonforms_rules or {}

    def get(self, key: str, default=None):
        """Support existing call sites (to avoid churn)."""
        return getattr(self, key, default)
