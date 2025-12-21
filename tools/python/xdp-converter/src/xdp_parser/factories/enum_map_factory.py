# xdp_parser/factories/enum_map_factory.py
from typing import Any, Optional
import xml.etree.ElementTree as ET
from xdp_parser.control_labels import ControlLabels
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.xdp_radio_selector import extract_radio_button_labels
from xdp_parser.xdp_utils import remove_duplicates


class EnumMapFactory(AbstractXdpFactory):
    """Collects enumeration values and builds both forward and reverse lookup maps."""

    def __init__(self, context):
        super().__init__(context)
        self.enum_maps: dict[str, dict[str, str]] = {}
        self.label_to_enum: dict[str, tuple[str, str]] = {}
        print("EnumMapFactory initialized. Ready to collect enumeration maps.")

    def handle_basic_input(self, elem: ET.Element, control_labels):
        name = elem.attrib.get("name")
        if not name:
            return None

        values = self._get_enumeration_values(elem)
        if values:
            self.enum_maps[name] = {str(i + 1): v for i, v in enumerate(values)}
            for i, v in enumerate(values):
                self.label_to_enum[v.strip()] = (name, str(i + 1))
        return None

    def handle_radio(self, elem: ET.Element, labels):
        name = elem.attrib.get("name")
        if not name:
            return None

        fields = []
        values = []

        for field_el in elem.findall("./field"):
            field_name = field_el.attrib.get("name")
            if not field_name:
                continue

            # Skip help buttons
            if field_el.find(".//ui/button") is not None:
                continue

            fields.append(field_name)

            caption_el = field_el.find(".//caption/value/text")
            if caption_el is not None and caption_el.text:
                values.append(caption_el.text.strip())
            else:
                values.append(field_name)

        if not fields or not values:
            return None

        # 1️⃣ Build enum map
        self.enum_maps[name] = {str(i + 1): v for i, v in enumerate(values)}

        # 2️⃣ Reverse lookup: LABEL → (group, value)
        for idx, label in enumerate(values):
            numeric = str(idx + 1)
            clean_label = label.strip()

            # Map the human-readable label
            self.label_to_enum[clean_label] = (name, numeric)

            # Map the checkbox field name (critical!)
            field_name = fields[idx]
            self.label_to_enum[field_name] = (name, numeric)

        # 3️⃣ Save ordering for the collapser
        self.context.radio_groups[name] = fields
        return None

    # other handle_* remain no-ops
    def handle_checkbox(self, *_):
        return None

    def handle_object_array(self, *_):
        return None

    def handle_group(
        self, elem: ET.Element, children: list, label: str
    ) -> Optional[Any]:
        return None

    def handle_radio_subform(self, elem: ET.Element, _):
        """
        Handle faux-radio-groups: subforms containing checkButtons marked with "circle".
        Extract radio labels using extract_radio_button_labels(), which matches what the
        XdpRadioSelector (UI stage) uses. This keeps enum maps consistent with UI-schema rules.

        Produces:
        - enum_maps[group_name] = { "1": label1, "2": label2, ... }
        - label_to_enum[label]  = (group_name, numeric_value)
        - label_to_enum[field]  = (group_name, numeric_value)
        - context.radio_groups[group_name] = [field1, field2, ...]
        """

        group_name = elem.attrib.get("name")
        if not group_name:
            return None

        # ------------------------------------------------------------
        # 1) Extract labels exactly as UI-stage does
        # ------------------------------------------------------------
        extracted_labels = extract_radio_button_labels(elem)
        if not extracted_labels or len(extracted_labels) < 2:
            return None  # not an actual radio group

        # ------------------------------------------------------------
        # 2) Collect the corresponding fields in order
        # ------------------------------------------------------------
        fields: list[str] = []
        for field_el in elem.findall("./field"):
            field_name = field_el.attrib.get("name")
            if not field_name:
                continue

            # Check this is a circle-mark "radio-like" checkbox
            is_radio = any(
                cb.tag.split("}", 1)[-1].lower() == "checkbutton"
                and cb.attrib.get("mark") == "circle"
                for cb in field_el.iter()
            )
            if is_radio:
                fields.append(field_name)

        if len(fields) != len(extracted_labels):
            # Continue anyway — assume extracted_labels is authoritative
            # and zip the shorter of the two.
            min_len = min(len(fields), len(extracted_labels))
            fields = fields[:min_len]
            extracted_labels = extracted_labels[:min_len]

        # ------------------------------------------------------------
        # 3) Build enum map from extracted labels
        # ------------------------------------------------------------
        enum_map = {}
        for idx, label in enumerate(extracted_labels):
            enum_map[str(idx + 1)] = label.strip()

        self.enum_maps[group_name] = enum_map

        # ------------------------------------------------------------
        # 4) Build reverse lookup for both label and control name
        # ------------------------------------------------------------
        for idx, label in enumerate(extracted_labels):
            numeric = str(idx + 1)
            field_name = fields[idx]

            clean_label = label.strip()

            # lookup by text (e.g. "Contingency")
            if clean_label:
                self.label_to_enum[clean_label] = (group_name, numeric)

            # lookup by field name (e.g. "chkContingency")
            self.label_to_enum[field_name] = (group_name, numeric)

        # ------------------------------------------------------------
        # 5) Record the ordering for rule resolution & collapser
        # ------------------------------------------------------------
        self.context.radio_groups[group_name] = fields

        return None

    def handle_help_text(self, *_):
        return None

    def _get_enumeration_values(self, field_node: ET.Element):
        enum_values = []
        for items_el in field_node.findall(".//items"):
            if (items_el.attrib.get("presence") or "").strip().lower() == "hidden":
                continue
            for text_el in items_el.findall("./text"):
                txt = "".join(text_el.itertext()).strip()
                if txt:
                    enum_values.append(txt)
        if enum_values:
            return [str(v) for v in remove_duplicates(enum_values)]
        return None


def normalize_enum_labels(enum_map, label_to_enum):
    # identity-safe shallow rewrite
    normalized = {}

    for control, entries in enum_map.items():
        normalized[control] = {}
        for k, label in entries.items():
            normalized[control][k] = label.strip()

    return normalized
