import xml.etree.ElementTree as ET
from typing import List
from constants import CTX_RADIO_GROUPS
from xdp_parser.control_labels import ControlLabels, inline_caption
from xdp_parser.control_helpers import is_checkbox, is_radio_button
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.orphaned_list_controls import is_add_remove_container
from xdp_parser.parse_context import ParseContext
from xdp_parser.parsing_helpers import is_object_array
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import remove_duplicates, is_hidden, is_subform, tag_name
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_radio_selector import extract_radio_button_labels


class XdpParser:
    """
    Central traversal engine for XDP trees.
    Delegates element creation to a pluggable factory
    that implements AbstractXdpFactory.
    """

    def __init__(self, factory: AbstractXdpFactory, context: ParseContext):
        self.factory = factory
        self.context = context
        self.control_labels = None

    # ----------------------------------------------------------------------
    # Small helper: maybe wrap a subform in a group due to visibility rules
    # ----------------------------------------------------------------------
    def _maybe_group_subform(
        self, subform: ET.Element, child_controls: List[XdpElement]
    ) -> List[XdpElement]:
        """
        If this subform is in context.visibility_groups, wrap its children
        in a group element via factory.handle_group. Otherwise just return
        the children unchanged.
        """
        name = subform.get("name") or ""

        # visibility_groups may or may not be on the context depending on caller.
        visibility_groups = getattr(self.context, "visibility_groups", None) or set()

        if name and name in visibility_groups:
            print(f"[XdpParser] Grouping subform '{name}' due to visibility rules.")
            label = inline_caption(subform) or name
            group = self.factory.handle_group(subform, child_controls, label)
            if group is not None:
                return [group]

        # Fallback: just return the child controls unchanged
        return child_controls

    # ----------------------------------------------------------------------
    # Entry point
    # ----------------------------------------------------------------------
    def parse_xdp(self) -> List:
        """
        Parse the XDP, returning a structured list of factory-built controls/sections.
        """

        form_root = self.find_form_root(self.context.get("root"))
        subforms = self.find_top_subforms(form_root)
        self.control_labels = ControlLabels(form_root, self.context)

        all_elements: List[XdpElement] = []
        for subform in subforms:
            elements = self.parse_subform(subform)  # -> List[XdpElement]
            if elements:
                # Top-level grouping (e.g., Section3Emergency etc.)
                grouped = self._maybe_group_subform(subform, elements)
                all_elements.extend(grouped)

        return remove_duplicates(self.to_form_elements(all_elements))

    def to_form_elements(self, xdp_elements) -> List:
        form_elements = []
        for xdp_element in xdp_elements:
            if not isinstance(xdp_element, XdpElement):
                # Defensive logging so we can see where the bad type came from
                print(
                    "[XdpParser] WARNING: Non-XdpElement in to_form_elements: "
                    f"{type(xdp_element)} | value={xdp_element}"
                )
                continue

            form_element = xdp_element.to_form_element()
            if form_element:
                form_elements.append(form_element)
        return form_elements

    # ----------------------------------------------------------------------
    # Core traversal
    # ----------------------------------------------------------------------
    def parse_subform(self, subform: ET.Element) -> List[XdpElement]:
        controls: List[XdpElement] = []

        # Skip list-control containers (Add/Remove) — already modelled elsewhere
        if is_add_remove_container(
            subform, self.context.get("root"), self.context.get("parent_map")
        ):
            return []

        # --- Handle object array (list-with-detail) ---
        if is_object_array(subform):
            # Extract child input controls (columns)
            row_fields = list(self.find_simple_controls(subform))

            control = self.factory.handle_object_array(
                subform, self.control_labels, row_fields
            )
            if control:
                controls.append(control)
            return remove_duplicates(controls)

        # --- Handle implicit radio group (subform full of radio-style checkButtons) ---
        radio_labels = extract_radio_button_labels(subform)
        if radio_labels:
            control = self.factory.handle_radio_subform(subform, self.control_labels)
            if control:
                controls.append(control)
            return remove_duplicates(controls)

        form_elements = self.find_simple_controls(subform)
        controls.extend(form_elements)
        return controls

    def find_simple_controls(self, node: ET.Element) -> List[XdpElement]:
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
                # New logic:
                # - If field is hidden AND has NO visibility rule → skip (structural hidden)
                # - Otherwise include it and let the rules engine show/hide at runtime
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
                nested_controls = self.parse_subform(elem)  # -> List[XdpElement]
                if nested_controls:
                    # ⚠️ IMPORTANT: group *nested_controls*, not the raw XML children list
                    grouped = self._maybe_group_subform(elem, nested_controls)
                    controls.extend(grouped)
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

    def find_top_subforms(self, form_root: ET.Element) -> List[ET.Element]:
        """Return first-level subforms containing logical input groups."""
        return [sf for sf in form_root if tag_name(sf.tag) == "subform"]

    # ----------------------------------------------------------------------
    # Visibility-rule awareness
    # ----------------------------------------------------------------------
    def _is_controlled_by_rules(self, elem: ET.Element) -> bool:
        """
        Returns True if there are visibility rules targeting this element.
        We check by:
          1) exact name match
          2) suffix match for dotted rule keys like 'Header.rbApplicant'
        """
        name = elem.get("name") or ""
        if not name:
            return False
        if name in self.context.get(CTX_RADIO_GROUPS, {}):
            return True

        # dotted keys may reference this control by suffix
        for key in self.context.get(CTX_RADIO_GROUPS, {}).keys():
            if key.endswith(f".{name}"):
                return True
        return False
