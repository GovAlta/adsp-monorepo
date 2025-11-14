def prune_ui_schema(node: dict):
    """
    Recursively prunes nodes:
      - removes groups without rules containing only a single element
      - removes groups consisting solely of HelpContent
      - removes wrapper layout nodes with a single child (e.g. VerticalLayout)
    """

    elements = node.get("elements")
    if not elements:
        return node

    # recurse first
    for i, child in enumerate(elements):
        if isinstance(child, dict) and "elements" in child:
            elements[i] = prune_ui_schema(child)

    # apply duplicate-help removal
    _remove_duplicate_help(elements)

    # if this node is a Group with no rule:
    is_group = node.get("type") == "Group"
    has_rule = "rule" in node

    if is_group and not has_rule:
        # case 1: only 1 element → lift it
        if len(elements) == 1:
            return elements[0]

        # case 2: all HelpContent → lift them out (return VerticalLayout)
        if all(e.get("type") == "HelpContent" for e in elements):
            return {"type": "VerticalLayout", "elements": elements}

    # flatten nested layouts like VerticalLayout(Group(X)) → X
    if node.get("type") in ("Group", "VerticalLayout", "HorizontalLayout"):
        if len(elements) == 1 and isinstance(elements[0], dict):
            only = elements[0]
            # Only flatten if the wrapper has no rule
            if "rule" not in node:
                return only

    return node


def _remove_duplicate_help(elements: list):
    """
    Removes HelpContent entries that appear immediately before a Control
    where the help text matches the control's label exactly.
    """
    i = 0
    while i < len(elements) - 1:
        cur = elements[i]
        nxt = elements[i + 1]

        # detect help + control
        if cur.get("type") == "HelpContent" and nxt.get("type") == "Control":
            help_text = cur.get("options", {}).get("help", "")
            ctrl_label = nxt.get("label", "")

            if _norm(help_text) == _norm(ctrl_label):
                # remove redundant help
                elements.pop(i)
                continue  # re-check same index with new successor

        i += 1


def _norm(txt: str) -> str:
    if not txt:
        return ""
    return " ".join(txt.split()).strip()
