def find_group_label(elements):
    """
    Robust group label extraction:

    A label should only appear if the group contains a *real* heading-like child.

    Rules:
      1. Prefer <draw> elements with lbl* prefix (strongest)
      2. Prefer short caption-like text from controls
      3. Prefer short HelpContent blocks (<= 80 chars)
      4. If NONE of the above exists → return "" (structural group)
    """

    # --------------------------------------
    # 1. lbl* draw objects → explicit headers
    # --------------------------------------
    for child in elements:
        n = getattr(child, "node", None)
        if n is not None:
            nm = n.get("name", "").lower()
            if nm.startswith("lbl"):
                text = _label_text_from_node(n)
                if text and len(text.strip()) <= 80:
                    return text.strip()

    # --------------------------------------
    # 2. control captions (but not yes/no radios)
    # --------------------------------------
    for child in elements:
        n = getattr(child, "node", None)
        if n is None:
            continue

        cap = inline_caption(n)
        if cap and len(cap.strip()) <= 60:
            # Avoid trivial captions that aren’t group headings
            if cap.strip().lower() not in {"yes", "no"}:
                return cap.strip()

    # --------------------------------------
    # 3. Short HelpContent blocks that look like headings
    # --------------------------------------
    for child in elements:
        if child.__class__.__name__ == "XdpHelpText":
            text = child.text.strip() if hasattr(child, "text") else ""
            if 5 <= len(text) <= 80:
                # Avoid paragraphs (multi-sentence)
                if "." not in text[:40]:
                    return text

    # --------------------------------------
    # 4. Fallback: NO real label → structural container → no label
    # --------------------------------------
    return ""
