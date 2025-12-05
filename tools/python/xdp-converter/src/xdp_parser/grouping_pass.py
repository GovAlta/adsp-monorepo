import xml.etree.ElementTree as ET
from typing import List
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_subform_placeholder import XdpSubformPlaceholder


class XdpGroupingPass:
    """
    Single-responsibility pass that:
      - consumes XdpSubformPlaceholder nodes
      - recursively groups their children
      - decides whether the subform should be a Group or be flattened
    """

    def __init__(self, factory: AbstractXdpFactory, context: ParseContext) -> None:
        self.factory = factory
        self.context = context
        self.child_map = {}
        # TODO get rid of this and pass context explicitly to resolve_group_label
        self.context.child_map = self.child_map

    # --------------------------------------------------
    # Public entry
    # --------------------------------------------------
    def group_placeholders(self, roots: List[XdpElement]) -> List[XdpElement]:
        result: List[XdpElement] = []
        for node in roots:
            result.extend(self._group_node(node))
        return result

    # --------------------------------------------------
    # Recursive grouping
    # --------------------------------------------------
    def _group_node(self, node: XdpElement) -> List[XdpElement]:
        if isinstance(node, XdpSubformPlaceholder):
            subform = node.subform_elem

            # Recursively group children first
            grouped_children: List[XdpElement] = []
            for child in node.children:
                grouped_children.extend(self._group_node(child))

            self.child_map[id(subform)] = grouped_children

            # Decide grouping
            if self.should_group_subform(subform, grouped_children):
                group = self._build_group_from_subform(subform, grouped_children)
                return [group] if group else grouped_children

            # Otherwise flatten
            return grouped_children

        # Non-placeholders pass through
        return [node]

    # --------------------------------------------------
    # Grouping heuristics
    # --------------------------------------------------
    def should_group_subform(self, subform, elements):
        """
        Decide whether this <subform> should become a Group.

        Criteria (ANY triggers grouping):
          1. Visibility rules reference ≥2 children
          2. 3+ real controls
          3. Contains radio cluster or object array
          4. Contains a section-style header (by TEXT)
        """

        # Filter real controls
        real_controls = [
            e
            for e in elements
            if e.is_control()
            or getattr(e, "is_radio", False)
            or getattr(e, "is_array", False)
        ]

        num_controls = len(real_controls)

        # Flatten trivial wrappers
        if num_controls <= 1:
            return False

        # 1) Visibility rules hitting multiple children
        if self._rules_target_subform(subform, real_controls):
            return True

        # 2) Several real controls → semantic cluster
        if num_controls >= 3:
            return True

        # 3) Radio cluster or array
        if any(
            getattr(e, "is_radio", False) or getattr(e, "is_array", False)
            for e in elements
        ):
            return True

        # 4) ANY help text that looks like a section header (text-based)
        if any(
            isinstance(e, XdpHelpText) and self._is_section_header(e) for e in elements
        ):
            return True

        return False

    def _rules_target_subform(self, subform, controls):
        rules = getattr(self.context, "jsonforms_rules", {}) or {}
        if not rules:
            return False

        names = {c.get_name() for c in controls}
        hits = sum(1 for n in names if n in rules)
        return hits >= 2

    def _is_section_header(self, help_elem: XdpHelpText) -> bool:
        """
        Does the help text *look* like a meaningful header?
        """

        text = (help_elem.text or "").strip()
        if not text:
            return False

        # Very strong signal: "Section N:"
        if text.startswith("Section "):
            return True

        # Header heuristic: short and ends with colon
        if text.endswith(":") and len(text) <= 60:
            return True

        return False

    def _build_group_from_subform(
        self,
        subform: ET.Element,
        elements: list["XdpElement"],
    ) -> "XdpGroup | None":

        if not elements:
            return None

        # The factory will call resolve_group_label(subform, context)
        return self.factory.handle_group(subform, elements, "")
