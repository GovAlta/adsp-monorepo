import xml.etree.ElementTree as ET
from typing import Dict, Optional, Tuple


class NodeFinder:
    def __init__(self, root: ET.Element):
        self.root = root
        self.ns = self._get_namespace()

    def find_first_node(self, node_name: str) -> Optional[ET.Element]:
        """
        Find the <variables> node under the XFA template, regardless of prefix/default NS.
        Tries prefix-aware XPath first; falls back to local-name scan.
        """

        # Preferred: prefix-based XPath if we discovered the XFA ns
        if "xfa" in self.ns:
            el = self.root.find(f".//xfa:{node_name}", self.ns)
            if el is not None:
                return el

        # Fallback: scan by local-name (works even if namespaces are weird)
        for el in self.root.iter():
            _, local = self._split_tag(el.tag)
            if local == node_name:
                return el

        return None

    def _get_namespace(self) -> Dict[str, str]:
        """
        Discover useful namespace URIs and return a prefix map for XPath:
          - 'xdp'  -> http://ns.adobe.com/xdp/
          - 'xfa'  -> http://www.xfa.org/schema/xfa-template/<version>/
        Only includes ones we actually find.
        """
        ns: Dict[str, str] = {}

        # Try to learn xdp from the root <xdp:xdp>
        uri, local = self._split_tag(self.root.tag)
        if local == "xdp" and uri:
            ns["xdp"] = uri

        # Walk until we find a <template> to learn the XFA template namespace
        for el in self.root.iter():
            uri, local = self._split_tag(el.tag)
            if local == "template" and uri:
                ns["xfa"] = uri
                break

        return ns

    @staticmethod
    def _split_tag(tag: str) -> Tuple[Optional[str], str]:
        """Return (namespace_uri, localname) from an Element.tag."""
        if tag.startswith("{"):
            uri, local = tag[1:].split("}", 1)
            return uri, local
        return None, tag
