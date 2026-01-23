# xdp_parser/factories/enum_map_factory.py
from typing import Any, Optional
import xml.etree.ElementTree as ET
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.xdp_pseudo_radio import extract_radio_button_labels


class EnumMapFactory(AbstractXdpFactory):
    """Collects enumeration values and builds both forward and reverse lookup maps."""

    def __init__(self, context):
        super().__init__(context)
        self.enum_maps: dict[str, dict[str, str]] = {}
        self.label_to_enum: dict[str, tuple[str, str]] = {}

    def handle_basic_input(self, elem: ET.Element, control_labels):
        name = elem.attrib.get("name")
        if not name:
            return None

        enum_map = self._get_enum_map(elem)  # dict[str,str] | None
        if not enum_map:
            return None

        self.enum_maps[name] = enum_map
        for k, label in enum_map.items():
            clean = (label or "").strip()
            if clean:
                self.label_to_enum[clean] = (name, str(k))
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

    def handle_help_icon(self, *_):
        return None

    def _get_saved_enum_map(self, field_node: ET.Element) -> Optional[dict[str, str]]:
        """
        For dropdown/list controls that encode the *saved* rawValue separately:
            <items> <text>Label...</text> </items>
            <items save="1" presence="hidden"> <text>Code...</text> </items>

        Returns: { saved_value : label }
        """
        items_nodes = field_node.findall(".//items")
        if not items_nodes:
            return None

        label_items: Optional[ET.Element] = None
        save_items: Optional[ET.Element] = None

        # Find save list and a non-save list for labels
        for it in items_nodes:
            if (it.get("save") or "").strip() == "1":
                save_items = it
            else:
                # Prefer a visible label list if available
                presence = (it.get("presence") or "").strip().lower()
                if label_items is None or presence != "hidden":
                    label_items = it

        if label_items is None or save_items is None:
            return None  # not a save-coded enum

        labels = [
            ("".join(t.itertext()) if t is not None else "").strip()
            for t in label_items.findall("./text")
        ]
        saves = [
            ("".join(t.itertext()) if t is not None else "").strip()
            for t in save_items.findall("./text")
        ]

        if len(labels) != len(saves):
            raise ValueError(
                f"items/save mismatch for field {field_node.get('name')!r}: "
                f"{len(labels)} labels vs {len(saves)} saves"
            )

        enum_map: dict[str, str] = {}
        for label, saved in zip(labels, saves):
            if saved == "":
                continue
            # Keep label as-is except normalize whitespace
            enum_map[str(saved).strip()] = (label or "").strip()

        return enum_map or None

    def _get_enum_map(self, field_node: ET.Element) -> dict[str, str] | None:
        label_items: list[str] = []
        save_items: list[str] = []

        for items_el in field_node.findall(".//items"):
            texts = []
            for text_el in items_el.findall("./text"):
                txt = "".join(text_el.itertext())
                texts.append(txt if txt is not None else "")

            is_hidden = (
                items_el.attrib.get("presence") or ""
            ).strip().lower() == "hidden"
            is_save = (items_el.attrib.get("save") or "").strip() == "1"

            if is_save and is_hidden:
                save_items.extend([t.strip() for t in texts])
            elif not is_hidden:
                label_items.extend([t.strip() for t in texts])

        # no labels => no enum
        if not label_items:
            return None

        # If we have a save-list and it lines up, map save->label
        if save_items and len(save_items) == len(label_items):
            return {save_items[i]: label_items[i] for i in range(len(label_items))}

        # Fallback: sequential keys
        return {str(i + 1): label_items[i] for i in range(len(label_items))}


def normalize_enum_labels(enum_map, label_to_enum):
    # identity-safe shallow rewrite
    normalized = {}

    for control, entries in enum_map.items():
        normalized[control] = {}
        for k, label in entries.items():
            normalized[control][k] = label.strip()

    return normalized
