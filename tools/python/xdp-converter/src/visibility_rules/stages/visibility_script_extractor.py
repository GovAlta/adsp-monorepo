# visibility_rules/stages/visibility_script_extractor.py

import re
from common.rule_model import ScriptEntry, RawRule
from visibility_rules.pipeline_context import (
    CTX_PARENT_MAP,
    CTX_RAW_RULES,
    CTX_XDP_ROOT,
)
from visibility_rules.stages.js_parser import parse_js_visibility_script


class VisibilityScriptExtractor:
    """
    Extracts <event> scripts from XDP fields/subforms and parses
    their visibility (presence) rules.
    """

    def process(self, context):
        print("[VisibilityScriptExtractor] Starting...")

        xdp_root = context[CTX_XDP_ROOT]
        parent_map = context[CTX_PARENT_MAP]
        self.parent_map = parent_map

        raw_rules = []

        # Iterate over <script> tags, not <event> tags
        for script_elem in xdp_root.findall(".//script"):
            code = (script_elem.text or "").strip()
            if not code:
                continue
            # Skip non-visibility scripts (e.g. keystroke, validation, calculations)
            if not re.search(r"\b(presence|relevant)\b", code):
                continue

            # Skip initialize events (only relevant for Adobe runtime, not JsonForms)
            event_elem = parent_map.get(script_elem)
            event_name = event_elem.get("name") if event_elem is not None else "unknown"
            if event_name == "event__initialize":
                continue

            # Extract parent <event> info if available
            event_elem = parent_map.get(script_elem)
            event_name = event_elem.get("name") if event_elem is not None else "unknown"

            # Infer target field/subform
            target_name = self._infer_target_from_body_or_parent(
                code, script_elem, parent_map
            )

            # Parse JS into condition/action blocks
            parsed_blocks = parse_js_visibility_script(code)
            for block in parsed_blocks:
                condition = block.condition.strip() if block.condition else None

                # 🔹 NEW: extract all presence targets inside this block
                visibility_targets = re.findall(
                    r"([A-Za-z0-9_.]+)\.presence\s*=\s*['\"](visible|hidden)['\"]",
                    block.body,
                    re.IGNORECASE,
                )

                if not visibility_targets:
                    # fallback — if no explicit .presence assignments found, keep old behaviour
                    visibility_targets = [
                        (
                            target_name,
                            "visible" if "visible" in block.body.lower() else "hidden",
                        )
                    ]

                # 🔹 NEW: create one RawRule per (target,effect) pair
                for vis_target, vis_state in visibility_targets:
                    effect = "VISIBLE" if vis_state.lower() == "visible" else "HIDDEN"

                    script_entry = ScriptEntry(
                        code=block.body,
                        condition=condition,
                        effect=effect,
                        driver_hint=None,
                        event=event_name,
                    )

                    raw_rule = RawRule(
                        target=vis_target,
                        xpath=self._get_xpath(script_elem, parent_map),
                        scripts=[script_entry],
                    )

                    # ⭐ IMPORTANT: Give DriverResolver access to the actual script node
                    raw_rule.element = script_elem

                    raw_rules.append(raw_rule)

        print(
            f"[VisibilityScriptExtractor] Extracted {len(raw_rules)} visibility rules."
        )
        context[CTX_RAW_RULES] = raw_rules
        return context

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

    def _infer_target_from_body_or_parent(
        self, code: str, event_elem, parent_map
    ) -> str:
        """
        Try to infer which field/subform this script affects.

        Strategy:
        1. Look for "<fieldname>.presence" assignments in the JS code.
        2. If none found, walk up the parent chain to find the nearest field element.
        3. Fall back to "unknown" if we really can’t tell.
        """
        import re

        # 1. Try to find a target from code like "Adult.presence = ..."
        m = re.search(r"([A-Za-z0-9_.]+)\.presence\s*=", code)
        if m:
            return m.group(1)

        # 2. Try parent chain: find nearest field with @name
        parent = parent_map.get(event_elem)
        while parent is not None:
            if parent.tag.endswith("field") and parent.get("name"):
                return parent.get("name")
            parent = parent_map.get(parent)

        # 3. Fallback
        return "unknown"

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


import re


def find_visibility_targets(block_body: str) -> list[tuple[str, str]]:
    """
    Return a list of (target, effect) pairs for assignments like:
      target.presence = "visible";
      target.presence = "hidden";
    """
    pattern = re.compile(
        r"([A-Za-z0-9_.]+)\.presence\s*=\s*['\"](visible|hidden)['\"]", re.I
    )
    return [
        (m.group(1), "VISIBLE" if m.group(2).lower() == "visible" else "HIDDEN")
        for m in pattern.finditer(block_body)
    ]
