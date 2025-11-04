import re
import xml.etree.ElementTree as ET
import contextlib
from typing import List, Dict, Optional
from threading import RLock

from schema_generator.html_to_markdown import html_to_markdown
from xdp_parser.XdpHelpText import XdpHelpText
from xdp_parser.control_labels import ControlLabels, inline_caption
from xdp_parser.control_helpers import is_checkbox, is_radio_button
from xdp_parser.form_diagnostics import FormDiagnostics
from xdp_parser.help_text_registry import HelpTextRegistry
from xdp_parser.orphaned_list_controls import is_list_control_container
from xdp_parser.parsing_helpers import (
    find_input_fields,
    is_object_array,
)
from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_section import XdpSection
from xdp_parser.xdp_checkbox import XdpCheckbox
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_utils import remove_duplicates, tag_name
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_object_array import XdpObjectArray
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_utils import is_hidden, is_subform, remove_duplicates
from schema_generator.form_element import FormElement
from dataclasses import dataclass


@dataclass
class ParserState:
    root: ET.Element
    parent_map: Dict[ET.Element, ET.Element]
    control_labels: Dict[str, str]
    visibility_rules: Dict[str, List[dict]]


class XdpParser:
    _instance: "XdpParser" = None
    _lock = RLock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Run once
        if getattr(self, "_init_done", False):
            return
        self._state: Optional[ParserState] = None
        self._init_done = True

    # ----- lifecycle -----
    def configure(
        self,
        root: ET.Element,
        parent_map: Dict[ET.Element, ET.Element],
        control_labels: Dict[str, str],
        visibility_rules: Dict[str, List[dict]],
    ) -> None:
        """Set or replace the parser's working context."""
        with self._lock:
            self._state = ParserState(
                root=root,
                parent_map=parent_map,
                control_labels=control_labels,
                visibility_rules=visibility_rules,
            )

    def clear(self) -> None:
        """Remove active context (optional, for safety between batches)."""
        with self._lock:
            self._state = None

    @contextlib.contextmanager
    def source(
        self,
        root: ET.Element,
        parent_map: Dict[ET.Element, ET.Element],
        control_labels: Dict[str, str],
        visibility_rules: Dict[str, List[dict]],
    ):
        """Temporarily switch source—great for batch processing loops."""
        with self._lock:
            prev = self._state
            self._state = ParserState(
                root, parent_map, control_labels, visibility_rules
            )
        try:
            yield self
        finally:
            with self._lock:
                self._state = prev

    # ----- accessors -----
    @property
    def state(self) -> ParserState:
        if self._state is None:
            raise RuntimeError("XdpParser not configured. Call .configure(...) first.")
        return self._state

    @property
    def root(self) -> ET.Element:
        return self.state.root

    @property
    def parent_map(self) -> Dict[ET.Element, ET.Element]:
        return self.state.parent_map

    @property
    def control_labels(self) -> Dict[str, str]:
        return self.state.control_labels

    @property
    def visibility_rules(self) -> Dict[str, List[dict]]:
        return self.state.visibility_rules

    def parse_xdp(self) -> List[FormElement]:
        form_root = self.find_form_root()
        subforms = self.find_top_subforms(form_root)
        form_elements: List[FormElement] = []
        for subform in subforms:
            fields = self.parse_subform(subform)
            if fields:
                form_elements.append(XdpSection(subform, fields).to_form_element())
        return form_elements

    def find_form_root(self):
        """
        Finds the <template>/<subform>/<subform> node containing the form elements.
        """
        root = self.root

        # Look for the first "template" node anywhere in the tree
        template = next((el for el in root.iter() if el.tag == "template"), None)
        if template is None:
            print("template node not found")
            return []

        subform1 = next((el for el in template if el.tag == "subform"), None)
        if subform1 is None:
            print("first level subform not found")
            return []

        subform2 = next((el for el in subform1 if el.tag == "subform"), None)
        if subform2 is None:
            print("second level subform not found")
            return []

        return subform2

    def find_top_subforms(self, form_root: ET.Element):
        """
        Returns a list of first-level <subform> elements;
        These elements contain a logical set of input groups.
        """
        input_groups = []
        for input_group in form_root:
            if self.is_potential_container(input_group):
                input_groups.append(input_group)
        return input_groups

    def parse_subform(self, subform: ET.Element) -> list["XdpElement"]:
        xdp_controls: list["XdpElement"] = []
        control_labels = ControlLabels(subform)

        # if container is just for list controls (Add, Remove), skip it
        # because they are already part of the JSON Form controls.
        if is_list_control_container(subform, self.root, self.parent_map):
            return []

        # --- handle list-with-detail ---
        if is_object_array(subform):
            table = self.parse_object_array(subform, control_labels)
            xdp_controls.append(table)
            return remove_duplicates(xdp_controls)

        # --- Handle implicit radio groups (subform full of round checkButtons)
        radio_options = self._handle_radio_buttons(subform, control_labels)
        if radio_options is not None:
            xdp_controls.append(radio_options)
            return remove_duplicates(xdp_controls)

        elements = list(subform)
        i = 0
        while i < len(elements):
            elem = elements[i]

            # Help content
            help_content = XdpHelpText.get_help_text(elem)
            if help_content:
                xdp_controls.append(XdpHelpText(help_content))

            # Handle radio button groups (<exclGroup>)
            if elem.tag == "exclGroup":
                xdp_controls.append(XdpRadio(elem, control_labels))
                i += 1
                continue

            # Checkboxes
            if is_checkbox(elem):
                controls, i = self._handle_grouped_controls(
                    elements,
                    i,
                    control_labels,
                    is_checkbox,
                    self._are_related_checkboxes,
                    self._build_checkbox_controls,
                )
                xdp_controls.extend(controls)
                continue

            # (Optional) keep individual radio detection if needed for legacy forms
            if is_radio_button(elem):
                controls, i = self._handle_grouped_controls(
                    elements,
                    i,
                    control_labels,
                    is_radio_button,
                    self._are_related_checkboxes,
                    lambda group, labels: self._build_radio_controls(
                        subform, group, labels
                    ),
                )
                xdp_controls.extend(controls)
                continue

            # Everything else
            control = self.extract_control(elem, control_labels)
            if control:
                xdp_controls.append(control)

            i += 1
        # --- If no controls were found but the subform has help text, treat it as a guidance block ---
        if not xdp_controls:
            help_blocks = self.grab_help_text(subform)
            if help_blocks:
                xdp_controls.extend(help_blocks)
        return remove_duplicates(xdp_controls)

    def grab_help_text(self, subform: ET.Element) -> list["XdpHelpText"]:
        """
        Collect all help text blocks (e.g. <draw>, <exData>, <value>/<text>)
        within the subform or its descendants.
        """
        help_content: list[XdpHelpText] = []
        for elem in subform.iter():  # full depth search
            help_text = XdpHelpText.get_help_text(elem)
            if help_text:
                help_content.append(XdpHelpText(help_text))
        return help_content

    def parse_object_array(
        self,
        array_element: ET.Element,
        control_labels: Dict[str, str],
        max_depth: int = 2,
    ) -> XdpObjectArray:
        name = array_element.attrib.get("name") or "Items"

        columns: List["XdpElement"] = []
        for field in find_input_fields(array_element, max_depth=max_depth):
            try:
                col = self.extract_control(field, control_labels)
                if col is None:
                    continue
                # If your XdpElement has is_leaf, prefer real inputs only
                if getattr(col, "is_leaf", True):
                    columns.append(col)
            except Exception:
                # fail-soft: skip any problematic field, keep processing others
                continue

        # Ensure at least one column exists so downstream doesn’t choke
        if not columns:
            # Create a minimal placeholder element via the factory if possible
            # (Assumes factory can handle a synthetic text field; if not, you can raise)
            placeholder = ET.Element("field", {"name": "value"})
            cols_caption = ET.SubElement(placeholder, "caption")
            ET.SubElement(cols_caption, "value").text = "Value"
            control = self.extract_control(placeholder, control_labels)
            if control:
                columns.append(control)

        return XdpObjectArray(array_element, name, columns, control_labels)

    def extract_control(
        self, form_element: ET.Element, control_labels: Dict[str, str]
    ) -> XdpElement | None:
        if is_radio_button(form_element):
            return XdpRadio(form_element, control_labels)
        elif form_element.tag == "field":
            if not self.is_info_button(form_element) and not is_hidden(form_element):
                # TODO handle the above cases
                return XdpBasicInput(form_element, control_labels)
        elif self.is_potential_container(form_element):
            nested_controls = self.parse_subform(form_element)
            if nested_controls and len(nested_controls) > 1:
                label = form_element.get("name") or ""
                if not label:
                    label = inline_caption(form_element)
                return XdpGroup(form_element, nested_controls, label)
            elif nested_controls and len(nested_controls) == 1:
                return nested_controls[0]

    def is_potential_container(self, would_be_container: ET.Element) -> bool:
        if not is_subform(would_be_container):
            return False
        if is_list_control_container(would_be_container, self.root, self.parent_map):
            return False

        has_input = any(
            tag_name(el.tag) in {"field", "exclGroup", "subform"}
            for el in would_be_container.iter()
        )
        has_guidance = bool(self.grab_help_text(would_be_container))

        return has_input or has_guidance

    def is_info_button(self, field: ET.Element) -> bool:
        """
        Return True if the given <field> is an 'information button':
        - field @name starts with 'btn'
        - caption text (after stripping) equals 'i'
        """
        name = field.get("name", "")
        if not name.startswith("btn"):
            return False

        # look for <caption>/<value>/<text> or <caption>/<value>/<exData>
        caption = field.find(".//caption/value")
        if caption is None:
            return False

        # text node
        if caption.find("text") is not None and caption.find("text").text:
            return caption.find("text").text.strip() == "i"

        # exData node (plain text only, ignore formatting)
        exdata = caption.find("exData")
        if exdata is not None and exdata.text:
            return exdata.text.strip() == "i"

        # Sometimes value itself has text
        if caption.text and caption.text.strip() == "i":
            return True

        return False

    @staticmethod
    def _are_related_checkboxes(prev_field: ET.Element, curr_field: ET.Element) -> bool:
        """Return True if two checkboxes likely belong to the same group."""

        def name_stem(name: str) -> str:
            n = name.lower()
            n = re.sub(r"[_\-]?\d+$", "", n)
            n = re.sub(r"(yes|no|true|false|y|n)$", "", n)
            return n

        def bind_prefix(bind: str) -> str:
            return bind.split(".", 1)[0].lower() if bind else ""

        # Same bind prefix or same name stem → probably related
        if (
            bind_prefix(prev_field.attrib.get("bind", ""))
            == bind_prefix(curr_field.attrib.get("bind", ""))
            != ""
        ):
            return True
        if (
            name_stem(prev_field.attrib.get("name", ""))
            == name_stem(curr_field.attrib.get("name", ""))
            != ""
        ):
            return True
        return False

    def _handle_checkboxes(
        self, elements: list[ET.Element], i: int, control_labels: ControlLabels
    ) -> tuple[list["XdpElement"], int]:
        """Handle consecutive checkbox elements starting at index i."""
        elem = elements[i]
        group = [elem]

        # Group consecutive related checkboxes
        while (
            i + 1 < len(elements)
            and is_checkbox(elements[i + 1])
            and self._are_related_checkboxes(elem, elements[i + 1])
        ):
            group.append(elements[i + 1])
            i += 1

        controls: list[XdpElement] = []

        if len(group) == 1:
            # Single checkbox
            control = self.extract_control(group[0], control_labels)
            if control:
                controls.append(XdpCheckbox(group[0], control_labels))
        else:
            # Grouped checkboxes
            label = control_labels.get(elem.get("name") or "")
            print(f"found checkbox group: {label}")
            # controls.append(XdpCheckboxGroup(subform, group, label))

        return controls, i + 1

    def _handle_radio_buttons(
        self, subform: ET.Element, control_labels: ControlLabels
    ) -> list["XdpElement"]:
        """Detect and build a radio button group control for the given subform."""
        radio_labels = extract_radio_button_labels(subform)
        if not radio_labels:
            return None

        return XdpRadioSelector(
            subform,
            radio_labels,
            control_labels,
        )

    def _handle_grouped_controls(
        self,
        elements: list[ET.Element],
        i: int,
        control_labels: ControlLabels,
        is_fn,
        are_related_fn,
        builder_fn,
    ) -> tuple[list["XdpElement"], int]:
        """Generic handler for grouped controls like checkboxes or radios."""
        elem = elements[i]
        group = [elem]

        # Gather consecutive related elements
        while (
            i + 1 < len(elements)
            and is_fn(elements[i + 1])
            and are_related_fn(elem, elements[i + 1])
        ):
            group.append(elements[i + 1])
            i += 1

        controls = builder_fn(group, control_labels)
        return controls, i + 1

    def _build_checkbox_controls(self, group, control_labels):
        """Construct one or more checkbox controls from the given group."""
        controls = []
        if len(group) == 1:
            control = self.extract_control(group[0], control_labels)
            if control:
                controls.append(XdpCheckbox(group[0], control_labels))
        else:
            label = control_labels.get(group[0].get("name") or "")
            print(f"found checkbox group: {label}")
            # controls.append(XdpCheckboxGroup(subform, group, label))
        return controls

    def _build_radio_controls(self, subform, group, control_labels):
        """Construct a radio button selector control for the subform."""
        radio_labels = extract_radio_button_labels(subform)
        if not radio_labels:
            return []
        return [
            XdpRadioSelector(
                subform,
                radio_labels,
                HelpTextRegistry(control_labels),
            )
        ]

    def diagnose(self):
        FormDiagnostics(self.root, self.visibility_rules).diagnose()
