import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import List, Optional

from visibility_rules.stages.trigger_ast import Trigger


@dataclass
class Action:
    # e.g., target.presence = 'visible'
    target: str
    hide: bool


@dataclass
class EventMetadata:
    owner: str  # enclosing control node.
    owner_type: str  # "field" or "subform"
    target_is_subform: bool  # True if action.target refers to a subform
    xpath: str  # use in debug/trace
    script_name: str  # use in debug/trace


@dataclass
class EventDescription:
    trigger: Trigger
    action: Action
    metadata: EventMetadata
    script_node: ET


@dataclass(frozen=True)
class VisibilityRule:
    target: str
    effect: str  # "HIDE" / "SHOW"
    trigger: Trigger
    xpath: Optional[str] = None

    def print(self):
        try:
            trig_str = self.trigger.to_flat_str()  # type: ignore[attr-defined]
        except Exception:
            trig_str = str(self.trigger)

        print("[Visibility Rule]")
        print(f"    Target: {self.target} -> (effect: {self.effect})")
        print(f"    Trigger: {trig_str}")
        print(f"    Xpath: {self.xpath}")
