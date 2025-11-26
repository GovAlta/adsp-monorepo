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

    # def build_ui_schema(self):
    #     schemas = []
    #     for element in self.elements:
    #         schemas.append(element.build_ui_schema())
    #     return schemas

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
    # --- Input hardening ---
    elements = list(elements or [])
    tol = abs(float(tolerance_mm or 0.0))  # negative? None? no problem.
    try:
        max_per_row = int(max_per_row)
    except (TypeError, ValueError):
        max_per_row = 4
    if max_per_row < 1:
        max_per_row = 1

    def safe_y(el):
        """Return float(y) or None if unavailable/invalid."""
        try:
            y = getattr(el, "y", None)
            return float(y) if y is not None else None
        except (TypeError, ValueError):
            return None

    rows = []
    current_row = []
    y_last = None

    for el in elements:
        # Skip literal Nones quietly
        if el is None:
            continue

        # VIP treatment: these always get a row of their own
        if not el.can_group_horizontally:
            if current_row:
                rows.append(current_row)
                current_row = []
                y_last = None
            rows.append([el])
            continue

        y = safe_y(el)

        # If y is missing/invalid, isolate to avoid math errors/mis-grouping
        if y is None:
            if current_row:
                rows.append(current_row)
                current_row = []
                y_last = None
            rows.append([el])
            continue

        # Start a new row if needed
        if not current_row:
            current_row = [el]
            y_last = y
            continue

        same_row = (abs((y_last if y_last is not None else y) - y) <= tol) and (
            len(current_row) < max_per_row
        )

        if same_row:
            current_row.append(el)
        else:
            rows.append(current_row)
            current_row = [el]
            y_last = y

    # Flush last row
    if current_row:
        rows.append(current_row)

    # Build groups: multi -> FormLayout, single -> element
    groups = []
    for row in rows:
        row = [e for e in row if e is not None]  # double-safety
        if not row:
            continue
        groups.append(
            FormLayout("HorizontalLayout", row, context) if len(row) > 1 else row[0]
        )

    return groups
