from html import unescape
import re
from xml.etree import ElementTree as ET


##
# Not a full HTML → Markdown converter, but handles basic tags and styling
# commonly found in Adobe XDP help text.
# Extend as new formatting oddities appear.
##
def html_to_markdown(exdata: ET.Element) -> str:
    body_node = exdata.find("./body")
    if body_node is None:
        return ""

    # Serialize child nodes of <body> to HTML string
    html = "".join(ET.tostring(e, encoding="unicode") for e in body_node)
    html = _clean_html_for_parse(html)

    # Normalize Adobe/XFA quirks
    html = html.replace("&nbsp;", " ").replace("\u00a0", " ")
    html = html.replace("<br>", "<br/>")  # normalize self-closing
    html = html.strip()

    # ElementTree chokes on multi-root fragments, so wrap safely
    if not html.startswith("<body"):
        html = f"<body>{html}</body>"

    try:
        root = ET.fromstring(html)
    except ET.ParseError:
        # Fallback: strip tags and return plain text
        return re.sub(r"<[^>]+>", "", html)

    return _convert(root)


def _convert(el: ET.Element) -> str:
    parts = []

    for node in el.iter():
        if not hasattr(node, "tag"):
            continue

        tag = node.tag.lower()
        style = node.attrib.get("style", "")
        text = node.text or ""
        tail = node.tail or ""

        pre, post = _style_marks(style)
        list_line = _detect_list(style, text)

        # Main text handling
        if tag == "p":
            if list_line:
                parts.append(list_line)
            elif text.strip():
                parts.append(f"{pre}{text.strip()}{post}\n\n")

        elif tag == "span":
            if "xfa-spacerun:yes" in style:
                parts.append(" ")
            elif text.strip():
                parts.append(f"{pre}{text.strip()}{post}")

        else:
            if text.strip():
                parts.append(f"{pre}{text.strip()}{post} ")

        # Include trailing text (after child elements)
        if tail:
            # Preserve leading space if it exists; trim only the right side
            parts.append(tail.rstrip() + " ")

    result = "".join(parts)
    result = unescape(result)
    # Collapse Adobe’s over-enthusiastic whitespace
    result = re.sub(r"[ \t\u00a0]+", " ", result)
    result = re.sub(r"\s{2,}", " ", result)
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


def _clean_html_for_parse(html: str) -> str:
    """Remove Adobe/XFA namespaces and ensure a valid single root for parsing."""
    html = re.sub(r"<body[^>]*>", "<body>", html, flags=re.IGNORECASE)
    html = re.sub(r"\s+xmlns(:\w+)?=\"[^\"]*\"", "", html)
    if not html.strip().startswith("<body"):
        html = f"<body>{html}</body>"
    return html


def _style_marks(style: str) -> tuple[str, str]:
    """Return Markdown wrappers based on CSS-like style attributes."""
    if not style:
        return "", ""
    style = style.lower()
    prefix = suffix = ""
    if "font-style:italic" in style:
        prefix = suffix = "*"
    if "font-weight:bold" in style:
        prefix = suffix = "**"
    if "text-decoration:underline" in style:
        prefix = suffix = "__"
    return prefix, suffix


def _detect_list(style: str, text: str) -> str | None:
    """Guess if this paragraph looks like a bullet/numbered list item."""
    if not text.strip():
        return None
    s = style.lower() if style else ""
    if "text-indent" in s or text.strip().startswith(("•", "-", "*")):
        return f"- {text.strip()}\n"
    return None
