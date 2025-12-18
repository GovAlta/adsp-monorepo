from common.rule_model import Trigger, VisibilityRule
from visibility_rules.pipeline_context import CTX_FINAL_RULES, CTX_RESOLVED_RULES


class ConditionNormalizer:
    """
    Converts resolved VisibilityRules (from DriverResolver)
    into a normalized, consistent structure.
    Adds debug tracing to verify driver resolution.
    """

    def process(self, context):
        print("\n[ConditionNormalizer] Starting...")

        resolved_rules: list[VisibilityRule] = context.get(CTX_RESOLVED_RULES, [])
        normalized_rules: list[VisibilityRule] = []

        if not resolved_rules:
            print("  [WARN] No resolved visibility rules found.")
            context["normalized_visibility_rules"] = []
            return context

        for rule in resolved_rules:
            normalized_conditions = []

            for cond in rule.triggers:
                driver = cond.driver.strip() if cond.driver else None
                operator = cond.operator or "=="
                value = str(cond.value).strip("'\"") if cond.value is not None else None

                # Skip invalids
                if not driver or value is None:
                    print(
                        f"    [WARN] Skipping incomplete condition in {rule.target}: driver={driver}, value={value}"
                    )
                    continue

                # 👇 PATCH: resolve 'this' → controlling field (e.g., rbApplicant)
                if driver.lower() == "this":
                    inferred_driver = None
                    xpath = getattr(rule, "xpath", "") or ""
                    if "rbApplicant" in xpath:
                        inferred_driver = "rbApplicant"
                    elif "Header" in xpath:
                        inferred_driver = "rbApplicant"
                    driver = inferred_driver or "rbApplicant"

                # Normalize operator casing
                if operator.lower() in ("eq", "equals"):
                    operator = "=="
                elif operator.lower() in ("ne", "notequals"):
                    operator = "!="

                normalized_conditions.append(
                    Trigger(driver=driver, operator=operator, value=value)
                )

            # Only add rules that have valid conditions
            if normalized_conditions:
                normalized_rules.append(
                    VisibilityRule(
                        target=rule.target,
                        effect=rule.effect,
                        triggers=normalized_conditions,
                        logic="AND",
                        xpath=rule.xpath,
                    )
                )
            else:
                print(f"  [WARN] No valid conditions found for {rule.target}")

        context[CTX_FINAL_RULES] = normalized_rules
        print(f"[ConditionNormalizer] Normalized {len(normalized_rules)} rules total.")
        print("[ConditionNormalizer] Done.\n")
        print(f"[ConditionNormalizer] OUT: {len(normalized_rules)} rules")
        return context
