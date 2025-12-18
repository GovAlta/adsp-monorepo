from common.rule_model import EventDescription, RawRule, VisibilityRule, Trigger
from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_PARENT_MAP,
    CTX_RADIO_GROUPS,
    CTX_RAW_RULES,
    CTX_RESOLVED_RULES,
    CTX_VISIBILITY_GROUPS,
)


class DriverResolver:
    """
    Resolves which field ('driver') controls each visibility rule and
    identifies dynamic subforms that should be treated as groups.

    Behaviour:
    - Extracts drivers from *.rawValue references in the condition script.
    - Normalizes driver names (drops .rawValue, whitespace, etc.).
    - Uses CTX_RADIO_GROUPS to remap faux-radio checkboxes to the group name.
    - Marks any rule target that is a <subform> as a visibility-group.
    """

    def __init__(self):
        # name -> <subform> element
        self.subforms_by_name: dict[str, object] = {}

    def process(self, context):
        print("\n[DriverResolver] Starting...")

        events: list[EventDescription] = context.get(CTX_RAW_RULES, [])
        parent_map = context.get(CTX_PARENT_MAP, {}) or {}
        radio_groups = context.get(CTX_RADIO_GROUPS, {}) or {}

        # Build the subform index once
        self._init_subforms_index(context)

        # Ensure we have a shared visibility_groups set in context
        visibility_groups = context.get(CTX_VISIBILITY_GROUPS)
        if visibility_groups is None:
            visibility_groups = set()
            context[CTX_VISIBILITY_GROUPS] = visibility_groups

        resolved_rules: list[VisibilityRule] = []

        for event in events:
            target_name = event.action.target

            # --- Mark subforms that are controlled by rules ---
            if target_name in self.subforms_by_name:
                visibility_groups.add(target_name)

            resolved_triggers: list[Trigger] = []

            for script in events:
                trigger = (script.trigger or "").strip()
                if not trigger:
                    continue

                # --- 1) Derive driver, operator, value ---
                driver, operator, value = self._parse_trigger(trigger)

                # --- 2) Resolve 'this' via parent_map (field / exclGroup / subform) ---
                if driver and driver.lower() == "this":
                    elem = getattr(event, "element", None)
                    parent = parent_map.get(elem) if elem is not None else None

                    # Walk upward until we hit a field, exclGroup, or subform
                    while parent is not None:
                        tag = parent.tag.split("}")[-1]
                        if tag in ("field", "exclGroup", "subform"):
                            name = parent.get("name")
                            if name:
                                driver = name
                                break
                        parent = parent_map.get(parent)

                # --- 3) Radio-group remapping (faux radio subforms) ---
                driver = self._remap_radio_driver(driver, driver, radio_groups)

                # --- 4) Faux-radio collapse (map checkbox → group label) ---
                collapsed_driver, collapsed_value = self._try_collapse_faux_radio(
                    driver, value, context
                )
                if collapsed_driver:
                    driver = collapsed_driver
                    value = collapsed_value

                resolved_triggers.append(
                    Trigger(
                        driver=driver,
                        operator=operator,
                        value=value,
                    )
                )

            # If we found at least one condition for this raw rule, emit a VisibilityRule
            if resolved_triggers:
                # Use the effect from the last script we processed (your existing behaviour)
                effect = script.effect
                resolved_rules.append(
                    VisibilityRule(
                        target=event.target,
                        effect=effect,
                        triggers=resolved_triggers,
                        logic="AND",
                        xpath=event.xpath,
                    )
                )

        context[CTX_RESOLVED_RULES] = resolved_rules
        print(f"[DriverResolver] OUT: {len(resolved_rules)} rules")
        print("[DriverResolver] Done.\n")
        return context

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

        Example:
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
        """
        For faux-radio groups, map a raw driver like 'chkEmergency' to the
        group name and human label using CTX_ENUM_MAP / CTX_RADIO_GROUPS.
        """
        radio_groups = context.get(CTX_RADIO_GROUPS, {}) or {}
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}

        for group_name, items in radio_groups.items():
            if driver in items:
                idx = items.index(driver) + 1
                enum_map = enum_maps.get(group_name, {})
                label = enum_map.get(str(idx), None)
                return group_name, label or str(idx)

        return None, None
