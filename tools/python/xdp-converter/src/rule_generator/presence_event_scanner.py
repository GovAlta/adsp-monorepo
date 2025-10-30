import re
import xml.etree.ElementTree as ET
from rule_generator.element_rules import ElementRules, Rule

PRESENCE_SET_RE = re.compile(
    r"""(?P<name>[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*\.presence\s*=\s*["'](?P<vis>visible|hidden|invisible|inactive)["']""",
    re.IGNORECASE,
)


class PresenceEventScanner:
    def __init__(self, root: ET.Element):
        self.root = root

    def scan(self):
        """Scan all <event> nodes in the XDP tree for visibility toggles."""
        results = {}
        for event in self.root.iter("event"):
            script_node = event.find("./script")
            if script_node is None or not script_node.text:
                continue

            script_text = script_node.text
            driver = self._find_driver_name(event)
            for m in PRESENCE_SET_RE.finditer(script_text):
                target_path = m.group("name")
                visibility = m.group("vis").lower()
                effect = "SHOW" if visibility == "visible" else "HIDE"
                target_node = self._resolve_target_path(target_path)
                target_name = (
                    target_node.attrib.get("name")
                    if target_node is not None
                    else target_path
                )
                if effect == "SHOW" and self._is_initially_hidden(target_name):
                    continue  # skip showing what should start hidden

                results.setdefault(target_name, ElementRules(target_name))
                results[target_name].add_rule(
                    Rule(effect, target_name, "ALWAYS", driver)
                )
        return results

    def _find_driver_name(self, event_node: ET.Element) -> str:
        """Get the parent field/subform name that owns the <event>."""
        parent = event_node
        while parent is not None:
            name = parent.attrib.get("name")
            if name:
                return name
            parent = parent.getparent() if hasattr(parent, "getparent") else None
        return "unknown"

    def _resolve_target_path(self, dotted_name: str) -> ET.Element | None:
        """Follow dotted paths like Sub1.Sub2.MyField into the XML tree."""
        parts = dotted_name.split(".")
        node = self.root
        for p in parts:
            found = None
            for child in node.iter():
                if child.attrib.get("name") == p:
                    found = child
                    break
            if not found:
                return None
            node = found
        return node

    def _is_initially_hidden(self, target_name: str) -> bool:
        """Return True if the element has an initial presence='hidden'."""
        for el in self.root.iter():
            if el.attrib.get("name") == target_name:
                pres = (el.attrib.get("presence") or "visible").lower()
                return pres in {"hidden", "invisible", "inactive"}
        return False
