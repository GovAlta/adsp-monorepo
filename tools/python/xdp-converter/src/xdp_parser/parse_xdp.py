# tools/python/xdp-converter/src/xdp_parser/parse_xdp.py

import xml.etree.ElementTree as ET
from typing import List

from visibility_rules.pipeline_context import CTX_RADIO_GROUPS
from xdp_parser.control_labels import ControlLabels, inline_caption
from xdp_parser.control_helpers import is_checkbox, is_radio_button
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.parse_context import ParseContext
from xdp_parser.parsing_helpers import is_object_array
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_radio_selector import extract_radio_button_labels
from xdp_parser.xdp_utils import (
    remove_duplicates,
    is_hidden,
    is_subform,
    tag_name,
)
from xdp_parser.orphaned_list_controls import is_add_remove_container
from xdp_parser.grouping_pass import XdpGroupingPass
from xdp_parser.xdp_subform_placeholder import XdpSubformPlaceholder


class XdpParser:
    """
    Central traversal engine for XDP trees.

    NEW ARCH:
      • This parser DOES NOT do grouping.
      • It builds a structural tree of XdpElement + XdpSubformPlaceholder.
      • A separate XdpGroupingPass turns placeholders into XdpGroup or flattens them.
    """

    def __init__(self, factory: AbstractXdpFactory, context: ParseContext):
        self.factory = factory
        self.context = context
        self.control_labels: ControlLabels | None = None

    # ----------------------------------------------------------------------
    # Entry point
    # ----------------------------------------------------------------------
    def parse_xdp(self) -> List[XdpElement]:
        """
        Parse the XDP, returning a structured list of factory-built controls/sections.
        """

        form_root = self.find_form_root(self.context.get("root"))
        subforms = self.find_top_subforms(form_root)
        self.control_labels = ControlLabels(form_root, self.context)

        # 1) Build a tree of placeholders + controls (NO grouping yet)
        root_nodes: List[XdpElement] = []
        for subform in subforms:
            node = self._parse_subform_to_node(subform)
            if node:
                root_nodes.append(node)

        # 2) Run the single grouping pass over the placeholder tree
        grouper = XdpGroupingPass(self.factory, self.context)
        grouped_elements = grouper.group_placeholders(root_nodes)

        # 3) Convert to JSONForms elements
        return remove_duplicates(self.to_form_elements(grouped_elements))

    def to_form_elements(self, xdp_elements: List[XdpElement]) -> List[dict]:
        form_elements: List[dict] = []
        for xdp_element in xdp_elements:
            form_element = xdp_element.to_form_element()
            if form_element:
                form_elements.append(form_element)
        return form_elements

    # ----------------------------------------------------------------------
    # Core traversal
    # ----------------------------------------------------------------------
    def _parse_subform_to_node(self, subform: ET.Element) -> XdpElement | None:
        """
        Parse a <subform> into either:
          • an XdpSubformPlaceholder (normal containers), or
          • a "leaf" control (object array / radio-subform), or
          • None (ignored containers like Add/Remove wrappers).
        """

        # Skip Add/Remove containers entirely
        if is_add_remove_container(
            subform, self.context.get("root"), self.context.get("parent_map")
        ):
            return None

        # Object-array (List-With-Detail) → single logical control
        if is_object_array(subform):
            row_fields = list(self.find_simple_controls(subform))
            control = self.factory.handle_object_array(
                subform, self.control_labels, row_fields
            )
            return control

        # Implicit radio subform (checkButton cluster) → radio selector
        radio_labels = extract_radio_button_labels(subform)
        if radio_labels:
            control = self.factory.handle_radio_subform(subform, self.control_labels)
            return control

        # Normal container subform → placeholder with children
        children = list(self.find_simple_controls(subform))
        if not children:
            return None

        return XdpSubformPlaceholder(subform, children, self.context)

    def parse_subform(self, subform: ET.Element) -> List[XdpElement]:
        """
        Backwards-compatible helper; some older code may still call this.
        Now it simply wraps _parse_subform_to_node.
        """
        node = self._parse_subform_to_node(subform)
        return [node] if node is not None else []

    def find_simple_controls(self, node: ET.Element) -> List[XdpElement]:
        """
        Traverse a subform and return a flat list of XdpElement controls
        and nested container nodes (XdpSubformPlaceholder).
        """
        controls: List[XdpElement] = []
        elements = list(node)
        i = 0

        while i < len(elements):
            elem = elements[i]

            # Help text
            help_text = XdpHelpText.get_help_text(elem)
            if help_text:
                control = self.factory.handle_help_text(elem, help_text)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Explicit or implicit radio groups (exclGroup or radio-like fields)
            if is_radio_button(elem):
                control = self.factory.handle_radio(elem, self.control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Checkboxes
            if is_checkbox(elem):
                control = self.factory.handle_checkbox(elem, self.control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Basic input fields
            if elem.tag == "field":
                # Hidden + uncontrolled by rules → skip (pure structural)
                if is_hidden(elem) and not self._is_controlled_by_rules(elem):
                    i += 1
                    continue

                control = self.factory.handle_basic_input(elem, self.control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Nested subforms (containers)
            if is_subform(elem):
                nested_node = self._parse_subform_to_node(elem)
                if nested_node:
                    controls.append(nested_node)
                i += 1
                continue

            i += 1

        return controls

    # ----------------------------------------------------------------------
    # Form structure helpers
    # ----------------------------------------------------------------------
    def find_form_root(self, root: ET.Element) -> ET.Element:
        """Find <template>/<subform>/<subform>."""
        template = next((el for el in root.iter() if el.tag == "template"), None)
        if not template:
            raise ValueError("Template node not found")
        level1 = next((el for el in template if el.tag == "subform"), None)
        level2 = (
            next((el for el in level1 if el.tag == "subform"), None) if level1 else None
        )
        if not level2:
            raise ValueError("Form root not found")
        return level2

    @staticmethod
    def find_top_subforms(form_root: ET.Element) -> List[ET.Element]:
        """Return first-level subforms containing logical input groups."""
        return [sf for sf in form_root if tag_name(sf.tag) == "subform"]

    # ----------------------------------------------------------------------
    # Visibility-rule awareness
    # ----------------------------------------------------------------------
    def _is_controlled_by_rules(self, elem: ET.Element) -> bool:
        """
        Returns True if there are visibility rules targeting this element.
        We check by:
          1) radio_groups membership
          2) dotted rule keys like 'Header.rbApplicant' (suffix match)
        """
        name = elem.get("name") or ""
        if not name:
            return False

        radio_groups = self.context.get(CTX_RADIO_GROUPS, {})
        if name in radio_groups:
            return True

        for key in radio_groups.keys():
            if key.endswith(f".{name}"):
                return True

        visibility_rules = getattr(self.context, "jsonforms_rules", {}) or {}
        if name in visibility_rules:
            return True
        for key in visibility_rules.keys():
            if key.endswith(f".{name}"):
                return True

        return False
