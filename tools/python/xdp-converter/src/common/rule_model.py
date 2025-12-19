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


@dataclass
class RawRule:
    """
    Represents all scripts related to a single XDP target (field/subform).
    Shared structure for both visibility and calculation pipelines.
    """

    target: str
    xpath: str
    events: List[EventDescription] = field(default_factory=list)


@dataclass
class VisibilityRule:
    """
    Represents a normalized, actionable visibility rule.
    Produced by ConditionNormalizer / RuleConsolidator.
    """

    target: str  # field or subform affected
    effect: str  # HIDE, SHOW, DISABLE, etc.
    triggers: List[Trigger] = field(default_factory=list)
    logic: str = "AND"  # how multiple conditions combine
    xpath: Optional[str] = None  # for trace/debugging
