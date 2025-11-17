from xml.etree import ElementTree as ET


def get_attr(elem: ET.Element, name: str, default=None):
    """
    Safely get an attribute from an element, returning a default if missing.
    """
    return elem.get(name) if elem is not None and name in elem.attrib else default


def get_text(elem: ET.Element, default=""):
    """
    Return text content stripped of whitespace, or a default if None.
    """
    if elem is None or elem.text is None:
        return default
    return elem.text.strip()


def find_first(elem: ET.Element, tag: str):
    """
    Find the first matching child element by tag name (non-recursive).
    """
    if elem is None:
        return None
    for child in elem:
        if child.tag == tag:
            return child
    return None


def find_all(elem: ET.Element, tag: str):
    """
    Return all direct child elements with the given tag.
    """
    if elem is None:
        return []
    return [child for child in elem if child.tag == tag]


def iter_all(elem: ET.Element, tag: str):
    """
    Recursively yield all elements with the given tag anywhere below.
    """
    if elem is None:
        return
    for child in elem.iter(tag):
        yield child


def pretty_path(elem: ET.Element):
    """
    Build a human-readable pseudo-path from the node up to the root.
    """
    path = []
    while elem is not None:
        tag = elem.tag
        parent = getattr(elem, "getparent", lambda: None)()
        index = ""
        if parent is not None:
            siblings = [e for e in parent if e.tag == tag]
            index = f"[{siblings.index(elem)+1}]" if len(siblings) > 1 else ""
        path.insert(0, f"{tag}{index}")
        elem = parent
    return "/" + "/".join(path)
