from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext


class FormLayout(FormElement):
    def __init__(self, type, elements, context: ParseContext):
        super().__init__("layout", None, None, context)
        self.type = type
        self.elements = elements
        self.is_leaf = False

    def build_ui_schema(self):
        ui_schema = {"type": self.type}
        ui_schema["elements"] = []
        for element in self.elements:
            child = element.to_ui_schema()
            if child:
                ui_schema["elements"].append(child)
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.elements:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas


class FormGroup(FormElement):
    def __init__(self, name, qualified_name, label, elements, context: ParseContext):
        super().__init__("group", name, qualified_name, context)
        self.elements = group_horizontally(elements, context)
        self.label = label
        self.is_leaf = False
        self.can_group_horizontally = False

    def build_ui_schema(self):
        # Build children first
        rendered_children = []
        for element in self.elements:
            child = element.to_ui_schema()
            if child is not None:
                rendered_children.append(child)

        # If group has no children → prune
        if not rendered_children:
            return None

        # COLLAPSE RULE #1:
        # If group has no label AND only one child group, collapse it
        if not self.label and len(rendered_children) == 1:
            only = rendered_children[0]
            if isinstance(only, dict) and only.get("type") == "Group":
                return only

        # Collapse layouts that have no label AND all children are HelpContent.
        if (
            not self.label
            and rendered_children
            and all(
                isinstance(child, dict) and child.get("type") == "HelpContent"
                for child in rendered_children
            )
        ):
            return {
                "type": "VerticalLayout",
                "elements": rendered_children,
            }
        # Build normal group UI
        ui_schema = {
            "type": "Group",
            "elements": rendered_children,
        }
        if self.label:
            ui_schema["label"] = self.label

        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.elements:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas


def group_horizontally(
    elements, context: ParseContext, tolerance_mm=1.0, max_per_row=4
):
    """
    Groups non-FormGroup elements into horizontal rows by similar y,
    at most `max_per_row` per row. Each FormGroup gets its own row.

    Returns a list containing either:
      - FormLayout("HorizontalLayout", [elements...]) for multi-element rows
      - Single elements for 1-element rows (including FormGroups)
    """

    return elements
