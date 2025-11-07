import xml.etree.ElementTree as ET


class ScriptExtractorBase:
    """
    Base class for extracting <event>, <calculate>, or <script> nodes from XDP.
    Subclasses can filter on event types or content keywords.
    """

    def _iter_scripts(self, xdp_root):
        """
        Generator yielding (element, script_text) pairs for relevant script elements.
        """
        for elem in xdp_root.iter():
            if elem.tag in ("event", "calculate", "script"):
                script_text = (elem.text or "").strip()
                if script_text:
                    yield elem, script_text

    def _get_parent_name(self, elem):
        """
        Try to find the parent field/subform name.
        """
        parent = getattr(elem, "getparent", lambda: None)()
        return parent.get("name") if parent is not None else "unknown"

    def _get_xpath(self, elem):
        """
        Build a pseudo-XPath for debugging or rule tracing.
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
