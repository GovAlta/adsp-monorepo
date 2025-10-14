import xml.etree.ElementTree as ET
import contextlib
from typing import List, Dict, Optional
from threading import RLock

from xdp_parser.control_label import ControlLabels, inline_caption
from xdp_parser.message_parser import JSHelpMessageParser
from xdp_parser.parsing_helpers import (
    _iter_leaf_field_nodes,
    extract_radio_button_labels,
    is_add_remove_controls_subform,
    is_object_array,
)
from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_category import XdpCategory
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_object_array import XdpObjectArray
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_radio_selector import XdpRadioSelector
from xdp_parser.xdp_utils import is_hidden, is_subform, remove_duplicates
from schema_generator.form_element import FormElement
from dataclasses import dataclass


@dataclass
class ParserState:
    root: ET.Element
    parent_map: Dict[ET.Element, ET.Element]
    control_labels: Dict[str, str]


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
    ) -> None:
        """Set or replace the parser's working context."""
        with self._lock:
            self._state = ParserState(
                root=root, parent_map=parent_map, control_labels=control_labels
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
    ):
        """Temporarily switch source—great for batch processing loops."""
        with self._lock:
            prev = self._state
            self._state = ParserState(root, parent_map, control_labels)
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

    def parse_xdp(self) -> List[FormElement]:
        categorization = self.find_categorization()
        categories = self.parse_categorization(categorization)
        form_elements: List[FormElement] = []
        for category in categories:
            fields = self.parse_subform(category)
            # No fields => nothing to input => no category.
            # Should we be looking for a category (page) that just contains help text
            # as well?
            if fields:
                form_elements.append(XdpCategory(category, fields).to_form_element())
        return form_elements

    def find_categorization(self):
        """
        Finds the <template>/<subform>/<subform> node which contains the categories.
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

    def parse_categorization(self, categorization):
        """
        Returns a list of first-level <subform> elements;
        These elements contain a logical set of inputs grouped as a category.
        """
        categories = []
        for category in categorization:
            if self.is_potential_container(category):
                categories.append(category)
        return categories

    def parse_subform(self, subform: ET.Element) -> list["XdpElement"]:
        xdp_controls: list["XdpElement"] = []
        control_labels = ControlLabels(subform)

        if is_add_remove_controls_subform(subform, self.root, self.parent_map):
            # Ignore controls-only subform
            return []

        # Is the subform a radio button collection?
        radio_labels = extract_radio_button_labels(subform)
        if radio_labels:
            xdp_controls.append(
                XdpRadioSelector(
                    subform, radio_labels, JSHelpMessageParser(control_labels)
                )
            )
            return remove_duplicates(xdp_controls)

        # Is the subform a list with detail?
        if is_object_array(subform):
            table = self.parse_object_array(subform)
            xdp_controls.append(table)
            return remove_duplicates(xdp_controls)

        for form_element in subform:
            control = self.extract_control(form_element)
            if control:
                xdp_controls.append(control)
        return remove_duplicates(xdp_controls)

    def parse_object_array(
        self, lwd_element: ET.Element, max_depth: int = 1
    ) -> XdpObjectArray:
        name = lwd_element.attrib.get("name") or "Items"

        columns: List["XdpElement"] = []
        for field_node in _iter_leaf_field_nodes(lwd_element, max_depth=max_depth):
            try:
                col = self.extract_control(field_node, self.control_labels)
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
            maybe = self.extract_control(placeholder)
            if maybe:
                columns.append(maybe)

        return XdpObjectArray(lwd_element, name, columns, self.control_labels)

    def extract_control(self, form_element: ET.Element) -> XdpElement | None:
        if form_element.tag == "exclGroup":
            return XdpRadio(form_element, self.control_labels)
        elif form_element.tag == "field":
            if not self.is_info_button(form_element) and not is_hidden(form_element):
                # TODO handle the above cases
                return XdpBasicInput(form_element, self.control_labels)
        elif self.is_potential_container(form_element):
            nested_controls = self.parse_subform(form_element)
            if nested_controls and len(nested_controls) > 1:
                label = self.control_labels.get(form_element.get("name") or "")
                if not label:
                    label = inline_caption(form_element)
                return XdpGroup(form_element, nested_controls, label)
            elif nested_controls and len(nested_controls) == 1:
                return nested_controls[0]

    def is_potential_container(self, xdp: ET.Element) -> bool:
        if not is_subform(xdp):
            return False
        # Must have at least one child that potentially has input elements
        for element in xdp:
            if element.tag in ["field", "exclGroup", "subform"]:
                return True
        return False

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
