def is_radio_button(field):
    """
    Determines if an XDP field or exclGroup represents a radio button group.
    """
    if field is None:
        return False

    tag = field.tag
    name = field.attrib.get("name", "").lower()

    # Rule 1: exclusive group is always a radio group
    if tag == "exclGroup":
        return True

    # Rule 2: naming hints — often like "optChoice", "radOption", etc.
    if name.startswith("rad") or "radio" in name or name.endswith("_opt"):
        return True

    # Rule 3: look for <ui><exclGroup> or <ui><radioButton> variants
    ui = field.find(".//ui")
    if ui is not None:
        if ui.find("exclGroup") is not None or ui.find("radioButton") is not None:
            return True

    # Rule 4: Sometimes each radio "button" is actually a field with a shared binding
    # Look for siblings with the same bind ref or name prefix
    bind = field.attrib.get("bind", "").lower()
    if bind and "radio" in bind:
        return True

    # Rule 5: fallback heuristic — small height + caption on right + not checkButton
    try:
        h = float(field.attrib.get("h", "0").replace("mm", ""))
        caption = field.find(".//caption")
        if (
            h <= 10
            and caption is not None
            and caption.attrib.get("placement") == "right"
            and ui is not None
            and ui.find("checkButton") is None
        ):
            return True
    except Exception:
        pass

    return False


def is_checkbox(field):
    """
    Determines if a field element is a checkbox.
    """
    # Safety first!
    if field is None or field.tag != "field":
        return False

    name = field.attrib.get("name", "").lower()

    # Rule 1: name hint
    if name.startswith("chk") or "checkbox" in name or name.endswith("_chk"):
        return True

    # Rule 2: explicit UI node with <checkButton>
    ui = field.find(".//ui")
    if ui is not None:
        # look for <checkButton> child
        if ui.find("checkButton") is not None:
            return True

    # Rule 3: sometimes XDPs define the type via SOM attributes (rare but possible)
    if (
        field.find(".//value/integer") is not None
        and field.find(".//ui/checkButton") is not None
    ):
        return True

    # Rule 4: heuristic — small height (often <10mm) and presence of <caption> to the right
    try:
        h = float(field.attrib.get("h", "0").replace("mm", ""))
        caption = field.find(".//caption")
        if (
            h <= 10
            and caption is not None
            and caption.attrib.get("placement") == "right"
        ):
            # checkbox-style layout
            return True
    except Exception:
        pass

    return False
