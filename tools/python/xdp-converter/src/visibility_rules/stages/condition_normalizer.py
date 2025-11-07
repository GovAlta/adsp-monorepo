from common.rule_model import VisibilityCondition, VisibilityRule


class ConditionNormalizer:
    """
    Converts resolved VisibilityRules (from DriverResolver)
    into a normalized, consistent structure.
    Adds debug tracing to verify driver resolution.
    """

    def process(self, context):
        print("\n[ConditionNormalizer] Starting...")

        resolved_rules: list[VisibilityRule] = context.get(
            "resolved_visibility_rules", []
        )
        normalized_rules: list[VisibilityRule] = []

        if not resolved_rules:
            print("  [WARN] No resolved visibility rules found.")
            context["normalized_visibility_rules"] = []
            return context

        for rule in resolved_rules:
            print(f"\n  [DEBUG] Processing rule for target: {rule.target}")
            normalized_conditions = []

            for cond in rule.conditions:
                driver = cond.driver.strip() if cond.driver else None
                operator = cond.operator or "=="
                value = str(cond.value).strip("'\"") if cond.value is not None else None

                print(
                    f"    [DEBUG] Raw condition → driver='{driver}', op='{operator}', value='{value}'"
                )

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
                    print(
                        f"    [DEBUG] replaced ambiguous driver 'this' with '{driver}' (xpath='{xpath}')"
                    )

                # Normalize operator casing
                if operator.lower() in ("eq", "equals"):
                    operator = "=="
                elif operator.lower() in ("ne", "notequals"):
                    operator = "!="

                normalized_conditions.append(
                    VisibilityCondition(driver=driver, operator=operator, value=value)
                )

                print(
                    f"    [NORMALIZE] {rule.target:<25} ← {driver:<25} {operator} {value}"
                )

            # Only add rules that have valid conditions
            if normalized_conditions:
                normalized_rules.append(
                    VisibilityRule(
                        target=rule.target,
                        effect=rule.effect,
                        conditions=normalized_conditions,
                        logic="AND",
                        xpath=rule.xpath,
                    )
                )
            else:
                print(f"  [WARN] No valid conditions found for {rule.target}")

        context["normalized_visibility_rules"] = normalized_rules
        print(f"[ConditionNormalizer] Normalized {len(normalized_rules)} rules total.")
        print("[ConditionNormalizer] Done.\n")

        return context
