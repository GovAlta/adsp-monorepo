from typing import List
from constants import CTX_JSONFORMS_RULES
from schema_generator.form import Form
from schema_generator.form_element import FormElement
from schema_generator.prune_ui_schema import prune_ui_schema
from xdp_parser.parse_context import ParseContext


class UiSchemaGenerator:
    def __init__(self, sections: List[FormElement], context: ParseContext):
        self.sections = sections
        self.context = context

    def to_schema(self):
        the_form = Form(self.sections, self.context)
        schema = the_form.to_ui_schema()

        schema = self._consolidate_help_blocks(schema)
        schema = self._lift_rules_to_group(schema)

        return prune_ui_schema(schema)

    def _consolidate_help_blocks(self, node):
        """
        Recursively walks the UI schema and merges consecutive HelpContent blocks
        within each container's `elements` list.

        - Only merges blocks in the same container.
        - Produces a single HelpContent block with:
            options: { markdown: true, help: [line1, line2, ...] }
        - Preserves all lines as-is; no heading/markdown guessing.
        """

        if not isinstance(node, dict):
            return node

        elements = node.get("elements")
        if not isinstance(elements, list):
            return node

        new_elems = []
        buffer = []  # consecutive HelpContent nodes

        def flush_buffer():
            if not buffer:
                return

            merged_lines = []
            for hc in buffer:
                opts = hc.get("options", {}) or {}
                help_val = opts.get("help", [])

                if isinstance(help_val, list):
                    merged_lines.extend(str(line) for line in help_val)
                elif isinstance(help_val, str):
                    merged_lines.append(help_val)
                elif help_val:
                    merged_lines.append(str(help_val))

            new_elems.append(
                {
                    "type": "HelpContent",
                    "options": {
                        "markdown": True,
                        "help": merged_lines,
                    },
                }
            )
            buffer.clear()

        for el in elements:

            # --- NEW RULE-PROTECTION LOGIC ---
            if (
                isinstance(el, dict)
                and el.get("type") == "HelpContent"
                and "rule" in el
            ):
                flush_buffer()
                # Recurse but keep node intact
                new_elems.append(self._consolidate_help_blocks(el))
                continue

            # --- EXISTING CONSOLIDATION LOGIC ---
            if isinstance(el, dict) and el.get("type") == "HelpContent":
                buffer.append(el)
                continue

            # non-help element → flush buffer, then recurse
            flush_buffer()
            if isinstance(el, dict):
                new_elems.append(self._consolidate_help_blocks(el))
            else:
                new_elems.append(el)

        flush_buffer()
        node["elements"] = new_elems
        return node

    def _lift_rules_to_group(self, node):
        """
        If all children of a Layout share the same rule and the layout
        has no rule of its own, lift the rule to the layout and remove it
        from each child. Also copy the rule onto any HelpContent blocks
        inside the group.
        """

        if not isinstance(node, dict):
            return node

        elements = node.get("elements")
        if isinstance(elements, list):
            # First recursively fix children
            new_elements = [self._lift_rules_to_group(el) for el in elements]
            node["elements"] = new_elements

            # Gather rules from children
            child_rules = []
            for el in new_elements:
                if isinstance(el, dict) and "rule" in el:
                    child_rules.append(el["rule"])

            if child_rules:
                # Check if they are all identical
                if all(r == child_rules[0] for r in child_rules):
                    group_rule = child_rules[0]

                    # Only lift if the group doesn't already have a rule
                    if "rule" not in node:
                        # Apply rule to group
                        node["rule"] = group_rule

                        # Remove rules from direct children
                        for el in new_elements:
                            if isinstance(el, dict) and "rule" in el:
                                del el["rule"]

                        # Also apply the parent rule to HelpContent blocks
                        for el in new_elements:
                            # Ensure HelpContent does NOT carry its own rule
                            for el in new_elements:
                                if (
                                    isinstance(el, dict)
                                    and el.get("type") == "HelpContent"
                                ):
                                    if "rule" in el:
                                        del el["rule"]

        return node
