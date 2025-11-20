from typing import List
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
            if isinstance(el, dict) and el.get("type") == "HelpContent":
                buffer.append(el)
                continue

            # non-help element → flush buffer, then recurse into child
            flush_buffer()
            if isinstance(el, dict):
                new_elems.append(self._consolidate_help_blocks(el))
            else:
                new_elems.append(el)

        flush_buffer()
        node["elements"] = new_elems
        return node
