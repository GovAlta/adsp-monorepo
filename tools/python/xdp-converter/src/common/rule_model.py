from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------
# 🧩 Base structures (shared between pipelines)
# ---------------------------------------------------------------------
@dataclass
class ScriptEntry:
    """
    Represents one <event> or <calculate> script block in an XDP field/subform.
    Shared between visibility and calculation pipelines.
    """

    event: Optional[str]
    code: str
    effect: Optional[str] = None
    condition: Optional[str] = None
    driver_hint: Optional[str] = None


@dataclass
class RawRule:
    """
    Represents all scripts related to a single XDP target (field/subform).
    Shared structure for both visibility and calculation pipelines.
    """

    target: str
    xpath: str
    scripts: List[ScriptEntry] = field(default_factory=list)


# ---------------------------------------------------------------------
# 👁️ Visibility-specific normalized structure
# ---------------------------------------------------------------------
@dataclass
class VisibilityCondition:
    """
    A normalized condition derived from a visibility script.
    """

    driver: str  # the controlling field name
    operator: str  # e.g., "==", "!=", ">", "<="
    value: Optional[str] = None  # constant being compared, if any


@dataclass
class VisibilityRule:
    """
    Represents a normalized, actionable visibility rule.
    Produced by ConditionNormalizer / RuleConsolidator.
    """

    target: str  # field or subform affected
    effect: str  # HIDE, SHOW, DISABLE, etc.
    conditions: List[VisibilityCondition] = field(default_factory=list)
    logic: str = "AND"  # how multiple conditions combine (future-proof)
    xpath: Optional[str] = None  # for trace/debugging


# ---------------------------------------------------------------------
# 🧮 Calculation-specific normalized structure
# ---------------------------------------------------------------------
@dataclass
class CalculationRule:
    """
    Represents a normalized calculation rule extracted from <calculate> scripts.
    """

    target: str  # field where result is stored
    expression: str  # e.g., "FieldA + FieldB"
    dependencies: List[str] = field(
        default_factory=list
    )  # fields referenced in expression
    language: Optional[str] = None
    xpath: Optional[str] = None
