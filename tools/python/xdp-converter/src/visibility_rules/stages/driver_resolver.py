import re
from common.rule_model import VisibilityRule, VisibilityCondition
from constants import (
    CTX_ENUM_MAP,
    CTX_PARENT_MAP,
    CTX_RAW_RULES,
    CTX_RESOLVED_RULES,
    CTX_RADIO_GROUPS,
)


class DriverResolver:
    """
    Resolves which field ('driver') controls each visibility rule.

    Behaviour:
    - Extracts drivers from *.rawValue references in the condition script.
    - Resolves 'this' up the parent map to the owning field/exclGroup.
    - Normalizes driver names (drops .rawValue, whitespace, etc.).
    - SPECIAL: For faux-radio subforms (e.g. Section2.chkContingency),
      maps the driver to the *group* name ('Section2'), not the individual
      checkbox ('chkContingency'), using CTX_RADIO_GROUPS.
    """

    RAWVAL_RE = re.compile(r"([A-Za-z0-9_.]+)\.rawValue")

    def process(self, context):
        print("\n[DriverResolver] Starting...")

        raw_rules = context.get(CTX_RAW_RULES, [])
        parent_map = context.get(CTX_PARENT_MAP, {})
        radio_groups = context.get(CTX_RADIO_GROUPS, {}) or {}

        resolved_rules: list[VisibilityRule] = []

        for raw in raw_rules:
            resolved_conditions: list[VisibilityCondition] = []

            for script in raw.scripts:
                cond_text = (script.condition or "").strip()
                if not cond_text:
                    continue

                # --- 1) Derive driver, operator, value ---
                driver_expr, operator, value = self._parse_condition_legacy(cond_text)

                # Normalize basic syntax artefacts
                driver = self._normalize_driver_name(driver_expr)

                # --- 2) Resolve 'this' via parent_map (field / exclGroup) ---
                if driver.lower() == "this":
                    elem = getattr(raw, "element", None)
                    parent = parent_map.get(elem) if elem is not None else None

                    # Walk upward until we hit a field or exclGroup
                    while parent is not None:
                        tag = parent.tag.split("}")[-1]
                        if tag in ("field", "exclGroup"):
                            name = parent.get("name")
                            if name:
                                driver = name
                                break
                        parent = parent_map.get(parent)

                # --- 3) Radio-group remapping (faux radio subforms) ---
                # Use the *original* driver expression (with full prefix)
                # together with CTX_RADIO_GROUPS to collapse
                #   form1.Page1.Section2.chkContingency
                # into:
                #   Section2
                driver = self._remap_radio_driver(driver_expr, driver, radio_groups)

                # 3️⃣ Faux-radio collapse
                collapsed_driver, collapsed_value = self._try_collapse_faux_radio(
                    driver, value, context
                )
                if collapsed_driver:
                    driver = collapsed_driver
                    value = collapsed_value

                resolved_conditions.append(
                    VisibilityCondition(
                        driver=driver,
                        operator=operator,
                        value=value,
                    )
                )

            if resolved_conditions:
                # Use the effect from the last script in this raw rule
                effect = script.effect
                resolved_rules.append(
                    VisibilityRule(
                        target=raw.target,
                        effect=effect,
                        conditions=resolved_conditions,
                        logic="AND",
                        xpath=raw.xpath,
                    )
                )

        context[CTX_RESOLVED_RULES] = resolved_rules
        print(f"[DriverResolver] OUT: {len(resolved_rules)} rules")
        print("[DriverResolver] Done.\n")
        return context

    # ------------------------------------------------------------------
    #  Condition parsing (keeps your old behaviour)
    # ------------------------------------------------------------------
    def _parse_condition_legacy(self, cond_text: str):
        """
        Keep the original behaviour:
        - Extract driver from '<something>.rawValue'
        - Fallback driver = 'this'
        - Extract operator & value with the simple regex approach
        """
        refs = self.RAWVAL_RE.findall(cond_text)
        if refs:
            driver_expr = refs[0]
        else:
            driver_expr = "this"

        operator = self._extract_operator(cond_text)
        value = self._extract_value(cond_text)

        return driver_expr, operator, value

    def _extract_operator(self, cond: str):
        for op in ["==", "!=", ">=", "<=", ">", "<"]:
            if op in cond:
                return op
        return "=="

    def _extract_value(self, cond: str):
        # Matches: == 1, == '1', == "1", == SOME_TOKEN
        m = re.search(r"==\s*(['\"]?([A-Za-z0-9_]+)['\"]?)", cond)
        if m:
            # group(2) is the inner token without quotes
            return m.group(2)
        return None

    # ------------------------------------------------------------------
    #  Normalization & radio-group logic
    # ------------------------------------------------------------------
    def _normalize_driver_name(self, driver: str | None) -> str | None:
        """Clean purely syntactic artefacts."""
        if not driver:
            return driver
        driver = driver.strip()
        driver = driver.replace(".rawValue", "")
        driver = driver.replace(" ", "")
        return driver

    def _remap_radio_driver(
        self,
        driver_expr: str,
        normalized_driver: str,
        radio_groups: dict,
    ) -> str:
        """
        If the driver expression refers to a checkbox inside a radio-like subform,
        return the *group* name (e.g., 'Section2') instead of the checkbox name
        (e.g., 'chkContingency').

        Examples:
          driver_expr = 'form1.Page1.Section2.chkContingency'
          radio_groups = {'Section2': [..., 'Seasonal Pool', ...]}

          → returns 'Section2'
        """
        if not driver_expr:
            return normalized_driver

        parts = driver_expr.replace(".rawValue", "").split(".")

        # Look from right to left, skipping the very last segment (field name)
        # to find the nearest ancestor that is a known radio group.
        if len(parts) >= 2:
            for i in range(len(parts) - 2, -1, -1):
                candidate = parts[i]
                if candidate in radio_groups:
                    return candidate

        # No radio group match → fall back to normalized last segment behaviour
        if "." in normalized_driver:
            return normalized_driver.split(".")[-1]

        return normalized_driver

    def _try_collapse_faux_radio(self, driver, value, context):
        radio_groups = context.get(CTX_RADIO_GROUPS, {}) or {}
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}

        for group_name, items in radio_groups.items():
            if driver in items:
                idx = items.index(driver) + 1
                enum_map = enum_maps.get(group_name, {})
                label = enum_map.get(str(idx), None)
                return group_name, label or str(idx)

        return None, None
