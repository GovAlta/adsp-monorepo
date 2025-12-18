# visibility_rules/stages/visibility_script_extractor.py

import re
import xml.etree.ElementTree as ET
from common.rule_model import Action, EventDescription, EventMetadata, RawRule, Trigger
from visibility_rules.pipeline_context import (
    CTX_PARENT_MAP,
    CTX_RAW_RULES,
    CTX_SUBFORM_MAP,
    CTX_XDP_ROOT,
)
from visibility_rules.stages.js_parser import parse_js_visibility_script


class VisibilityScriptExtractor:
    """
    Extracts <event> scripts from XDP fields/subforms and parses
    their visibility (presence) rules.
        Example XDP snippet:
            <script contentType="application/x-javascript">
                if (Section2.chkEmergency.rawValue == 1){
                    this.presence = "visible";
                    }
                else {
                    this.presence = "hidden";
                }
            </script>
        In this example:
            - script_owner: the field/subform containing the <script>
            - target: name of affected field/subform (from "this" or explicit)
            - trigger: Condition triggering action e.g. Section2.chkEmergency.rawValue == 1

    """

    def process(self, context):
        print("[VisibilityScriptExtractor] Starting...")

        xdp_root = context[CTX_XDP_ROOT]
        parent_map = context[CTX_PARENT_MAP]
        self.parent_map = parent_map
        self.subform_map = context[CTX_SUBFORM_MAP]

        parsed_rules = []

        # Iterate over <script> tags, not <event> tags
        for script_elem in xdp_root.findall(".//script"):
            code = (script_elem.text or "").strip()
            if not code:
                continue
            # Skip non-visibility scripts (e.g. keystroke, validation, calculations)
            if not re.search(r"\b(presence|relevant)\b", code):
                continue

            # Skip initialize events (only relevant for Adobe runtime, not JsonForms)
            script = parent_map.get(script_elem)
            script_name = script.get("name") if script is not None else "unknown"
            if script_name == "event__initialize":
                continue

            target_name = self._get_target(code, script_elem)
            if not target_name:
                print(f"[EXTRACTOR] No target for script:\n{script_name} found")
                continue

            # Parse JS into trigger/action blocks
            raw_rules = parse_js_visibility_script(code)
            for r_rule in raw_rules:
                if not r_rule.trigger:
                    print(f"[EXTRACTOR] Trigger not found in: {script_name.strip()}")
                    continue

                trigger = self._parse_trigger(r_rule.trigger.strip(), script_elem)
                actions = self._extract_events(r_rule.actions, script_elem)
                metadata = self._extract_metadata(script_elem, target_name)

                if not actions:
                    print(f"[EXTRACTOR] No actions found in script:\n{script_name}")
                    continue

                # Create one RawRule per (target,effect) pair
                for action in actions:
                    event = EventDescription(
                        action=action,
                        trigger=trigger,
                        script_node=script_elem,
                        metadata=metadata,
                    )
                    debug_event(
                        event,
                        ["Section3Default", "Section3Emergency", "section3Seasonal"],
                    )
                    parsed_rules.append(event)

        print(f"[Extractor] Extracted {len(parsed_rules)} visibility rules.")
        context[CTX_RAW_RULES] = parsed_rules
        return context

    def _extract_events(self, action_list: str, script_elem) -> list[Action]:
        raw_actions = re.findall(
            r"([A-Za-z0-9_.]+)\.presence\s*=\s*['\"](visible|hidden)['\"]",
            action_list,
            re.I,
        )

        if not raw_actions:
            return []

        final_actions: list[Action] = []
        for target, effect in raw_actions:
            if target.lower() == "this":
                parent = self._find_enclosing_control(script_elem)
                target = parent.get("name") if parent is not None else None
            if not target:
                continue
            hide = effect.lower() == "hidden"
            final_actions.append(Action(target, hide))
        return final_actions

    def _find_enclosing_control(self, elem):
        """
        Find the nearest enclosing field or subform for the given element.
        """
        parent = self.parent_map.get(elem)
        while parent is not None:
            if parent.tag in ["field", "subform"]:
                return parent
            parent = self.parent_map.get(parent)
        return None

    def _extract_script_text(self, event_elem):
        """
        Return the JavaScript text for an <event> element.
        Handles <event><script>...</script></event> and inline cases.
        """
        # Case 1: nested <script>
        script_node = event_elem.find("./script")
        if script_node is not None and script_node.text:
            return script_node.text.strip()

        # Case 2: inline event content
        if event_elem.text:
            return event_elem.text.strip()

        return ""

    def _get_target(self, code: str, event_elem) -> str:
        # 1. Try to find a target from code like "Section2.presence = ..."
        m = re.search(r"([A-Za-z0-9_.]+)\.presence\s*=", code)
        if m and m.group(1).lower() != "this":
            return m.group(1)

        # 2. Try parent chain: find nearest named field / subform
        parent = self._find_enclosing_control(event_elem)
        if parent is not None and parent.get("name"):
            return parent.get("name")

        return None

    def _get_xpath(self, elem, parent_map) -> str:
        """
        Reconstruct a simple XPath-like path from the element to the root.
        This is mostly for debugging and context awareness.
        Example: /template/subform[1]/field[@name='rbApplicant']/event[@name='initialize']
        """
        path_parts = []

        while elem is not None:
            tag = elem.tag
            name = elem.get("name")
            if name:
                path_parts.append(f"{tag}[@name='{name}']")
            else:
                path_parts.append(tag)
            elem = parent_map.get(elem)

        # Reverse to get root → leaf order
        return "/" + "/".join(reversed(path_parts))

    TRIGGER_EXPR = re.compile(r"([A-Za-z0-9_.]+)\.rawValue")

    def _parse_trigger(self, trigger: str, script_node: ET) -> Trigger:
        """
        Extract driver,operator & value from a trigger expression.
        - e.g. from "Section2.chkEmergency.rawValue == 1"
        ️- Returns (driver, operator, value)
        """
        driver = self._extract_driver(trigger)
        if not driver:
            return None
        if driver.lower() == "this":
            parent = self._find_enclosing_control(script_node)
            driver = parent.get("name")
        if not driver:
            return None
        operator = self._extract_operator(trigger)
        value = self._extract_value(trigger, operator)
        return Trigger(driver=driver, operator=operator, value=value)

    def _extract_driver(self, trigger: str):
        m = self.TRIGGER_EXPR.search(trigger)
        if m:
            return m.group(1)
        return None

    def _extract_operator(self, trigger: str):
        for op in ["==", "!=", ">=", "<=", ">", "<"]:
            if op in trigger:
                return op
        return "=="

    def _extract_value(self, expr: str, operator: str):
        """
        Return the RHS value of a comparison expression.

        Examples:
        "Section2 == 'Emergency'"   -> "Emergency"
        "count >= 3"                -> "3"
        "foo != null"               -> "null"
        "bar == SOME_TOKEN"         -> "SOME_TOKEN"
        """
        if not operator or operator not in expr:
            return None

        # Split once on the operator
        _, rhs = expr.split(operator, 1)

        value = rhs.strip()

        # Strip surrounding quotes if present
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]

        return value

    def _extract_metadata(self, script_elem, target_name: str) -> EventMetadata:
        control = self._find_enclosing_control(script_elem)
        owner = control.get("name") if control is not None else ""
        owner_type = control.tag if control is not None else ""
        target_is_subform = target_name and target_name in self.subform_map
        xpath = self._get_xpath(script_elem, self.parent_map)
        return EventMetadata(
            owner=owner,
            owner_type=owner_type,
            target_is_subform=target_is_subform,
            xpath=xpath,
            script_name=script_elem.get("name") or "",
        )


def debug_event(event: EventDescription, targets=None):
    trigger = event.trigger
    action = event.action
    metadata = event.metadata
    if event.trigger.operator != "==":
        print(
            "[EXTRACTOR EVENT] Received non-equality operator on driver {trigger.driver}"
        )
    do_print = targets is None or action.target.lower() in [t.lower() for t in targets]
    if do_print:
        print("[EXTRACTOR EVENT]")
        print(f"    Trigger: {trigger.driver} {trigger.operator} {trigger.value}")
        print(f"    Target: {action.target} -> ({'HIDE' if action.hide else 'SHOW'})")
        print(f"    Action: {'HIDE' if action.hide else 'SHOW'}")
        print(f"    Owner: {metadata.owner} ({metadata.owner_type})")
        print(f"    XPath: {metadata.xpath}")
