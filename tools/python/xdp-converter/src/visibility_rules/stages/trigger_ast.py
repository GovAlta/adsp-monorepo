from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Iterator, Union, List


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
        n = self.node
        if isinstance(n, AtomicCondition):
            return f"{n.driver} {n.op.value} {self._quote_if_needed(n.value)}"
        if isinstance(n, CompoundCondition):
            return f"({n.left} {n.op.value} {n.right})"
        return "<unknown-trigger>"

    @staticmethod
    def _quote_if_needed(v: str) -> str:
        v = v if v is not None else ""
        if v == "":
            return "<blank>"
        if any(ch.isspace() for ch in v):
            return f'"{v}"'
        return v

    @staticmethod
    def or_all(triggers: List[Trigger]) -> Trigger:
        return Trigger._combine_all(BooleanOp.OR, triggers)

    @staticmethod
    def and_all(triggers: List[Trigger]) -> Trigger:
        return Trigger._combine_all(BooleanOp.AND, triggers)

    @staticmethod
    def _combine_all(op: BooleanOp, triggers: List[Trigger]) -> Trigger:
        ts = [t for t in triggers if t is not None]
        if not ts:
            raise ValueError(f"Cannot combine empty trigger list with {op}")
        if len(ts) == 1:
            return ts[0]
        # Flatten first so we don't build nested (A OR (B OR C)) chains
        flat = Trigger._flatten_same_op_list(op, ts)
        return Trigger._build_balanced(op, flat)

    @staticmethod
    def flatten_trigger(t: Trigger) -> Trigger:
        """Recursively flatten same-op chains in an AST."""
        n = t.node
        if isinstance(n, AtomicCondition):
            return t

        assert isinstance(n, CompoundCondition)
        left = Trigger.flatten_trigger(n.left)
        right = Trigger.flatten_trigger(n.right)

        # If children changed, rebuild node
        rebuilt = Trigger.compound(left, n.op, right)

        # Now flatten if this node is a same-op chain
        parts = Trigger.collect_same_op(n.op, rebuilt)
        if len(parts) == 1:
            return parts[0]
        return Trigger._build_balanced(n.op, parts)

    @staticmethod
    def collect_same_op(op: BooleanOp, t: Trigger) -> List[Trigger]:
        """Collect operands from a chain of the same boolean op."""
        n = t.node
        if isinstance(n, CompoundCondition) and n.op == op:
            return Trigger.collect_same_op(op, n.left) + Trigger.collect_same_op(
                op, n.right
            )
        return [t]

    @staticmethod
    def _flatten_same_op_list(op: BooleanOp, triggers: List[Trigger]) -> List[Trigger]:
        out: List[Trigger] = []
        for t in triggers:
            out.extend(Trigger.collect_same_op(op, t))
        return out

    @staticmethod
    def _build_balanced(op: BooleanOp, parts: List[Trigger]) -> Trigger:
        """Build a balanced binary tree from a list of Trigger operands."""
        if len(parts) == 1:
            return parts[0]
        mid = len(parts) // 2
        left = Trigger._build_balanced(op, parts[:mid])
        right = Trigger._build_balanced(op, parts[mid:])
        return Trigger.compound(left, op, right)

    def to_flat_str(self) -> str:
        return self._to_flat_str(self)

    @staticmethod
    def _to_flat_str(t: "Trigger") -> str:
        n = t.node
        if isinstance(n, AtomicCondition):
            return f"{n.driver} {n.op.value} {Trigger._quote_if_needed(n.value)}"

        assert isinstance(n, CompoundCondition)
        op = n.op
        parts = Trigger.collect_same_op(op, t)

        rendered = [Trigger._to_flat_str(p) for p in parts]
        joiner = f" {op.value} "
        return "(" + joiner.join(rendered) + ")"

    @staticmethod
    def remove_duplicates(op: BooleanOp, t: "Trigger") -> "Trigger":
        parts = Trigger.collect_same_op(op, t)
        seen_atoms: set[AtomicCondition] = set()
        deduped: List[Trigger] = []

        for p in parts:
            pn = p.node
            if isinstance(pn, AtomicCondition):
                if pn in seen_atoms:
                    continue
                seen_atoms.add(pn)
            deduped.append(p)

        if not deduped:
            raise ValueError("Dedupe removed all operands (unexpected)")
        if len(deduped) == 1:
            return deduped[0]
        return Trigger._build_balanced(op, deduped)
