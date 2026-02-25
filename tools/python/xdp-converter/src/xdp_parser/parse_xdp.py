# tools/python/xdp-converter/src/xdp_parser/parse_xdp.py

import re
import xml.etree.ElementTree as ET
from typing import List

from schema_generator.form_element import FormElement
from visibility_rules.pipeline_context import CTX_RADIO_GROUPS
from xdp_parser.control_labels import ControlLabels
from xdp_parser.control_helpers import is_checkbox, is_radio_button
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.help_text_extractor import HelpTextExtractor
from xdp_parser.parse_context import ParseContext
from xdp_parser.parsing_helpers import is_object_array
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import (
    is_hidden,
    is_subform,
    tag_name,
)
from xdp_parser.orphaned_list_controls import is_add_remove_container
from xdp_parser.refinement_pass import XdpRefinementPass
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
        self.control_labels: ControlLabels

    # ----------------------------------------------------------------------
    # Entry point
    # ----------------------------------------------------------------------
    def parse_xdp(self) -> List[FormElement]:
        """
        Parse the XDP, returning a list of controls.
        """

        form_root = self.find_form_root(self.context.get_root())
        subforms = self.find_top_subforms(form_root)
        self.control_labels = ControlLabels(form_root, self.context)

        root_nodes: List[XdpElement] = []
        for subform in subforms:
            node = self._parse_subform_to_node(subform)
            if node:
                root_nodes.append(node)

        refiner = XdpRefinementPass(self.factory, self.control_labels, self.context)
        refined_elements = refiner.refine(root_nodes)

        return self.to_form_elements(refined_elements)

    def to_form_elements(self, xdp_elements: List[XdpElement]) -> List[FormElement]:
        form_elements: List[FormElement] = []
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
            subform, self.context.get_root(), self.context.get_parent_map()
        ):
            return None

        # List-With-Detail
        if is_object_array(subform):
            row_fields = list(self.find_simple_controls(subform))
            control = self.factory.handle_object_array(
                subform, self.control_labels, row_fields
            )
            return control

        children = list(self.find_simple_controls(subform))
        if not children:
            return None

        return XdpSubformPlaceholder(subform, children, self.context)

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

            # Help text from click-event
            if elem.tag == "field" and HelpTextExtractor.is_help_icon_field(elem):
                payload = HelpTextExtractor.get_help_from_click_event(elem)
                if payload:
                    help_content = self.factory.handle_help_icon(elem, payload["text"])
                    if help_content:
                        controls.append(help_content)
                    i += 1
                    continue

            # Help text from a draw element
            help_text = HelpTextExtractor.get_help_from_draw(elem)
            if help_text:
                help_content = self.factory.handle_help_text(elem, help_text)
                if help_content:
                    controls.append(help_content)
                i += 1
                continue

            # Explicit or implicit radio groups (exclGroup or radio-like fields)
            if is_radio_button(elem):
                help_content = self.factory.handle_radio(elem, self.control_labels)
                if help_content:
                    controls.append(help_content)
                i += 1
                continue

            # Checkboxes
            if is_checkbox(elem):
                help_content = self.factory.handle_checkbox(elem, self.control_labels)
                if help_content:
                    controls.append(help_content)
                i += 1
                continue

            # Basic input fields
            if elem.tag == "field":
                # Hidden + uncontrolled by rules → skip (pure structural)
                if (
                    is_hidden(elem)
                    and not self._is_controlled_by_rules(elem)
                    and not self._looks_actionable(elem)
                ):
                    i += 1
                    continue

                help_content = self.factory.handle_basic_input(
                    elem, self.control_labels
                )
                if help_content:
                    controls.append(help_content)
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
        if template is None:
            raise ValueError("Template node not found")
        level1 = next((el for el in template if el.tag == "subform"), None)
        level2 = (
            next((el for el in level1 if el.tag == "subform"), None) if level1 else None
        )
        if level2 is None:
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

        radio_groups = self.context.get_radio_groups() or {}
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

    def _looks_actionable(self, elem: ET.Element) -> bool:
        # If it has items, it's a choice control (dropdown/listbox) => keep it
        if elem.find(".//items") is not None:
            return True

        # If it has any script/event, it's participating in runtime behavior => keep it
        if elem.find(".//event") is not None or elem.find(".//script") is not None:
            return True

        return False

    @staticmethod
    def _normalize_text(s: str | None) -> str:
        if not s:
            return ""
        s = s.strip()
        s = re.sub(r"\s+", " ", s)  # collapse whitespace
        s = s.casefold()  # better than lower() for unicode
        s = s.rstrip(" .:;")  # titles often differ only by punctuation
        return s

    @classmethod
    def _is_same_text(cls, a: str | None, b: str | None) -> bool:
        return cls._normalize_text(a) != "" and cls._normalize_text(
            a
        ) == cls._normalize_text(b)
