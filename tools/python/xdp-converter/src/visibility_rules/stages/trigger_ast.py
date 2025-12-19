from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Iterator, Union


##
#  Trigger:
#  A trigger represents a set of conditions that, when satisfied,
#  cause an action to occur (e.g., show/hide a field). Trigger are made up of
#  atomic-conditions (driver op value) combined with boolean operators (AND/OR).
# . Triggers are represented by an abstract syntax tree made up of atomic conditions
#  and compound conditions.
##
class BooleanOp(str, Enum):
    AND = "AND"
    OR = "OR"


class ComparisonOp(str, Enum):
    EQ = "=="
    NE = "!="
    GE = ">="
    LE = "<="
    GT = ">"
    LT = "<"

    @classmethod
    def from_symbol(cls, symbol: str) -> "ComparisonOp":
        symbol = (symbol or "").strip()
        try:
            return cls(symbol)  # Enum "value" lookup
        except ValueError:
            raise ValueError(f"Unknown comparison operator: {symbol!r}") from None


@dataclass(frozen=True)
class AtomicCondition:
    """driver op value"""

    driver: str
    op: ComparisonOp
    value: str  # keep as string for now; downstream can cast/normalize

    def __str__(self) -> str:
        # Quote if it contains spaces (optional)
        v = self.value
        if any(ch.isspace() for ch in v):
            v = f'"{v}"'
        return f"{self.driver} {self.op.value} {v}"


@dataclass(frozen=True)
class CompoundCondition:
    """Trigger (and/or) Trigger)"""

    left: "Trigger"
    op: BooleanOp
    right: "Trigger"

    def __str__(self) -> str:
        return f"({self.left} {self.op.value} {self.right})"


TriggerNode = Union[AtomicCondition, CompoundCondition]


@dataclass(frozen=True)
class Trigger:
    """
    A trigger is either:
      - an atomic condition, or
      - a compound condition of triggers.
    """

    node: TriggerNode

    @staticmethod
    def atom(driver: str, op: ComparisonOp, value: str) -> "Trigger":
        return Trigger(AtomicCondition(driver=driver, op=op, value=value))

    @staticmethod
    def compound(left: "Trigger", op: BooleanOp, right: "Trigger") -> "Trigger":
        return Trigger(CompoundCondition(left=left, op=op, right=right))

    def is_atomic(self) -> bool:
        return isinstance(self.node, AtomicCondition)

    def is_compound(self) -> bool:
        return isinstance(self.node, CompoundCondition)

    def iter_atomic(self) -> Iterator[AtomicCondition]:
        """Depth-first iteration over all atomic conditions."""
        yield from self._iter_atomic(self.node)

    def _iter_atomic(self, n: TriggerNode) -> Iterator[AtomicCondition]:
        if isinstance(n, AtomicCondition):
            yield n
        else:
            yield from self._iter_atomic(n.left.node)
            yield from self._iter_atomic(n.right.node)

    def walk(self) -> Iterator[TriggerNode]:
        """Yield every node in the tree (compound + atomic), depth-first."""
        yield from self._walk(self.node)

    def _walk(self, n: TriggerNode) -> Iterator[TriggerNode]:
        yield n
        if isinstance(n, CompoundCondition):
            yield from self._walk(n.left.node)
            yield from self._walk(n.right.node)

    def operators(self) -> set[BooleanOp]:
        """Return the set of boolean ops used (AND/OR)."""
        ops: set[BooleanOp] = set()
        for n in self.walk():
            if isinstance(n, CompoundCondition):
                ops.add(n.op)
        return ops

    def __str__(self) -> str:
        return str(self.node)
