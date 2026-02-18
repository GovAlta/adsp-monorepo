import xml.etree.ElementTree as ET
from dataclasses import dataclass

from visibility_rules.stages.trigger_ast import Trigger


@dataclass
class Action:
    target: str
    hide: bool


@dataclass
class EventDescription:
    trigger: Trigger
    action: Action
    script_node: ET
    owner: str


@dataclass(frozen=True)
class VisibilityRule:
    target: str
    effect: str  # "HIDE" / "SHOW"
    trigger: Trigger

    def print(self):
        try:
            trig_str = self.trigger.to_flat_str()  # type: ignore[attr-defined]
        except Exception:
            trig_str = str(self.trigger)

        print("[Visibility Rule]")
        print(f"    Target: {self.target} -> (effect: {self.effect})")
        print(f"    Trigger: {trig_str}")
