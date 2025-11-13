import xml.etree.ElementTree as ET
from typing import List
from xdp_parser.control_labels import ControlLabels, inline_caption
from xdp_parser.control_helpers import is_checkbox, is_radio_button
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.orphaned_list_controls import is_list_control_container
from xdp_parser.parse_context import ParseContext
from xdp_parser.parsing_helpers import is_object_array
from xdp_parser.xdp_utils import remove_duplicates, is_hidden, is_subform, tag_name
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_radio_selector import extract_radio_button_labels


class XdpParser:
    """
    Central traversal engine for XDP trees.
    Delegates element creation to a pluggable factory
    that implements AbstractXdpFactory.

    This version is visibility-rule aware:
    - We no longer blanket-skip hidden fields. Instead, we include hidden
      fields that have visibility rules targeting them and let the rule
      engine decide whether they render.
    """

    def __init__(self, factory: AbstractXdpFactory, context: ParseContext):
        self.factory = factory
        self.context = context

    # ----------------------------------------------------------------------
    # Entry point
    # ----------------------------------------------------------------------
    def parse_xdp(self) -> List:
        """
        Parse the XDP, returning a structured list of factory-built controls/sections.

        Args:
            root: stripped-ns XDP root element
            parent_map: optional element->parent map (used for list-control detection)
            visibility_rules: optional rules dict to detect hidden-but-controlled fields
        """

        form_root = self.find_form_root(self.context.get("root"))
        subforms = self.find_top_subforms(form_root)

        all_elements = []
        for subform in subforms:
            elements = self.parse_subform(subform)
            if elements:
                # Preserve grouping for top-level subforms (e.g. Adult, Child)
                label = subform.get("name") or inline_caption(subform) or ""
                group = self.factory.handle_group(subform, elements, label)
                if group:
                    all_elements.append(group)

        return remove_duplicates(self.to_form_elements(all_elements))

    def to_form_elements(self, xdp_elements) -> List:
        form_elements = []
        for xdp_element in xdp_elements:
            form_element = xdp_element.to_form_element()
            if form_element:
                form_elements.append(form_element)
        return form_elements

    # ----------------------------------------------------------------------
    # Core traversal
    # ----------------------------------------------------------------------
    def parse_subform(self, subform: ET.Element) -> List:
        controls = []
        control_labels = ControlLabels(subform, self.context)

        # Skip list-control containers (Add/Remove) — already modelled elsewhere
        if is_list_control_container(
            subform, self.context.get("root"), self.context.get("parent_map")
        ):
            return []

        # --- Handle object array (list-with-detail) ---
        if is_object_array(subform):
            control = self.factory.handle_object_array(subform, control_labels)
            if control:
                controls.append(control)
            return remove_duplicates(controls)

        # --- Handle implicit radio group (subform full of radio-style checkButtons) ---
        radio_labels = extract_radio_button_labels(subform)
        if radio_labels:
            control = self.factory.handle_radio(subform, control_labels)
            if control:
                controls.append(control)
            return remove_duplicates(controls)

        # --- Traverse child elements ---
        elements = list(subform)
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
                control = self.factory.handle_radio(elem, control_labels)
                if control:
                    # name = elem.get("name") or ""
                    # if name in (
                    #     "rbCoverYes_No",
                    #     "rbStatusYes_No",
                    #     "rbCanadaYes_No",
                    #     "rbApplicant",
                    # ):
                    #     print(
                    #         f"[FACTORY] label resolution for {name!r}: "
                    #         f"from_ControlLabels={label_from_labels!r}, inline={inline!r}, fallback={fallback!r}"
                    #     )

                    controls.append(control)
                i += 1
                continue

            # Checkboxes
            if is_checkbox(elem):
                control = self.factory.handle_checkbox(elem, control_labels)
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

                control = self.factory.handle_basic_input(elem, control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Nested subforms (containers)
            if is_subform(elem):
                nested_controls = self.parse_subform(elem)
                if nested_controls:
                    label = elem.get("name") or inline_caption(elem) or ""
                    control = self.factory.handle_group(elem, nested_controls, label)
                    if control:
                        controls.append(control)
                i += 1
                continue

            i += 1

        return remove_duplicates(controls)

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
        if name in self.context.get("visibility_rules", {}):
            return True

        # dotted keys may reference this control by suffix
        for key in self.context.get("visibility_rules", {}).keys():
            if key.endswith(f".{name}"):
                return True
        return False
