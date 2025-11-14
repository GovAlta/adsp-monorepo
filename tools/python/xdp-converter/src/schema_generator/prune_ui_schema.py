def prune_ui_schema(schema: dict):
    if not isinstance(schema, dict):
        return schema

    elements = schema.get("elements")
    if isinstance(elements, list):
        # Recurse first
        for i, child in enumerate(elements):
            if isinstance(child, dict):
                elements[i] = prune_ui_schema(child)

        # Then apply dedupe at this level
        _remove_duplicate_help(elements)

    return schema


def _remove_duplicate_help(elements):
    i = 0
    while i < len(elements) - 1:
        cur = elements[i]
        nxt = elements[i + 1]

        if _is_help(cur) and _is_control(nxt):
            if _same_normalized_help_and_label(cur, nxt):
                del elements[i]
                continue
        i += 1


def _is_help(elem):
    return isinstance(elem, dict) and elem.get("type") == "HelpContent"


def _is_control(elem):
    return isinstance(elem, dict) and elem.get("type") == "Control"


def _same_normalized_help_and_label(help_elem, control_elem):
    help_list = help_elem.get("options", {}).get("help", [])
    if isinstance(help_list, list) and help_list:
        help_text = help_list[0]
    else:
        help_text = help_list or ""

    return _norm(help_text) == _norm(control_elem.get("label", ""))


def _norm(text):
    return " ".join(str(text).split()).strip().lower()
