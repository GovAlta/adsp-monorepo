from dataclasses import replace
from common.rule_model import VisibilityRule
from visibility_rules.pipeline_context import CTX_FINAL_RULES


class RuleConsolidator:
    """
    Consolidates visibility rules that share the same (target, effect, logic).

    ✔ Filters out non-UI targets (e.g. "this")
    ✔ Groups by (target, effect, logic)
    ✔ OR/AND merges condition lists (no semantic guessing)
    ✔ Preserves logic + xpath from representative rule
    ✔ Returns a *new* list of VisibilityRule (no in-place mutation)
    ✔ Writes merged rules back into context
    """

    _SPECIAL_TARGETS = {"this"}

    def _is_meaningful_target(self, target: str | None) -> bool:
        if not target:
            return False
        return target.strip().lower() not in self._SPECIAL_TARGETS

    def process(self, context):
        rules: list[VisibilityRule] = context.get(CTX_FINAL_RULES, [])

        print("\n[RuleConsolidator] Starting...")
        print(f"[RuleConsolidator] IN raw rules: {len(rules)}")

        if not rules:
            print("[RuleConsolidator] No rules to consolidate.\n")
            context[CTX_FINAL_RULES] = []
            return context

        # ---------------------------------------------------------
        # 1) Filter out meaningless targets
        # ---------------------------------------------------------
        filtered: list[VisibilityRule] = []
        for r in rules:
            if not self._is_meaningful_target(r.target):
                print(f"  [Drop] Ignore script-only target '{r.target}'")
                continue
            filtered.append(r)

        print(f"[RuleConsolidator] After filtering: {len(filtered)} remain")

        if not filtered:
            print("[RuleConsolidator] All rules filtered out.\n")
            context[CTX_FINAL_RULES] = []
            return context

        # ---------------------------------------------------------
        # 2) Group by (target, effect, logic)
        #    (logic is important for how JsonFormsEmitter will interpret them)
        # ---------------------------------------------------------
        grouped: dict[tuple[str, str, str], list[VisibilityRule]] = {}
        for rule in filtered:
            key = (rule.target, rule.effect, (rule.logic or "AND").upper())
            grouped.setdefault(key, []).append(rule)

        print(f"[RuleConsolidator] Unique groups: {len(grouped)}")

        # ---------------------------------------------------------
        # 3) Merge groups (just concatenate conditions; logic stays as-is)
        # ---------------------------------------------------------
        consolidated: list[VisibilityRule] = []

        for (target, effect, logic), group in grouped.items():
            merged_conditions = []
            representative = group[0]

            for r in group:
                conds = getattr(r, "conditions", [])
                if not conds:
                    print(f"    [WARN] Rule for target '{r.target}' has no conditions.")
                    continue
                merged_conditions.extend(conds)

            if not merged_conditions:
                print(
                    f"  [SKIP] No usable conditions for group target='{target}', effect='{effect}'"
                )
                continue

            # Create a *new* rule; do not mutate any original
            merged_rule = replace(
                representative,
                target=target,
                effect=effect,
                logic=logic,
                conditions=merged_conditions,
            )
            consolidated.append(merged_rule)

        print(f"\n[RuleConsolidator] OUT consolidated rules: {len(consolidated)}\n")

        context[CTX_FINAL_RULES] = consolidated
        return context
