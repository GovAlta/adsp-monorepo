# visibility_rules/stages/rule_consolidator.py

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from visibility_rules.pipeline_context import CTX_RESOLVED_RULES, CTX_FINAL_RULES
from visibility_rules.stages.trigger_ast import Trigger, BooleanOp
from common.rule_model import VisibilityRule

debug = False


class RuleConsolidator:
    """
    Consolidate EventDescriptions into VisibilityRules.

    Groups by (target, effect) and combines triggers with OR:
        rule.trigger = t1 OR t2 OR t3 ...

    Then:
      - flattens OR-chains
      - removes duplicate atomic operands in OR-chains (A OR A -> A)
      - asserts 'this' does not appear in any atomic driver
    """

    _SPECIAL_TARGETS = {"this"}

    def process(self, context):
        events = context.get(CTX_RESOLVED_RULES, []) or []
        if debug:
            print("\n[RuleConsolidator] Starting...")
            print(f"[RuleConsolidator] IN events: {len(events)}")

        grouped: Dict[Tuple[str, str], List[Trigger]] = {}
        rep_xpath: Dict[Tuple[str, str], Optional[str]] = {}

        skipped = 0

        for ev in events:
            if not ev or not ev.trigger or not ev.action:
                skipped += 1
                continue

            target = (ev.action.target or "").strip()
            if not target or target.lower() in self._SPECIAL_TARGETS:
                skipped += 1
                continue

            effect = "HIDE" if ev.action.hide else "SHOW"
            key = (target, effect)

            grouped.setdefault(key, []).append(ev.trigger)

            if key not in rep_xpath:
                rep_xpath[key] = getattr(getattr(ev, "metadata", None), "xpath", None)

        consolidated: List[VisibilityRule] = []

        for (target, effect), triggers in grouped.items():
            combined = self._combine_or(triggers)
            self._assert_no_this(combined, target=target, effect=effect)

            rule = VisibilityRule(
                target=target,
                effect=effect,
                trigger=combined,
                xpath=rep_xpath.get((target, effect)),
            )

            if debug:
                rule.print()

            consolidated.append(rule)

        if debug:
            print(
                f"\n[RuleConsolidator] OUT rules: {len(consolidated)} "
                f"(groups={len(grouped)}, skipped_events={skipped})\n"
            )
        context[CTX_FINAL_RULES] = consolidated
        return context

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _combine_or(self, triggers: List[Trigger]) -> Trigger:
        """
        OR-combine a list of Trigger ASTs into one, with cleanup.
        """
        if not triggers:
            raise ValueError("[RuleConsolidator] Cannot consolidate empty trigger list")

        combined = Trigger.or_all(triggers)

        # Structural cleanup (OR-of-OR, etc.)
        combined = Trigger.flatten_trigger(combined)

        # Remove duplicates in OR chains (A OR A -> A)
        combined = Trigger.remove_duplicates(BooleanOp.OR, combined)

        # One more flatten pass keeps it tidy after rebuilding
        combined = Trigger.flatten_trigger(combined)

        return combined

    def _assert_no_this(self, t: Trigger, *, target: str, effect: str) -> None:
        """
        Contract: DriverResolver should have eliminated 'this' by now.
        Fail fast if it leaks through.
        """
        for atom in t.iter_atomic():
            if (atom.driver or "").strip().lower() == "this":
                raise ValueError(
                    f"[RuleConsolidator] Contract violation: 'this' driver leaked into "
                    f"final rules for target={target!r} effect={effect!r}. "
                    f"Trigger={t.to_flat_str()}"
                )
