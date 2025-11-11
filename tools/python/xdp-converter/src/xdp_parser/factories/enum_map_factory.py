# xdp_parser/factories/enum_map_factory.py
import xml.etree.ElementTree as ET
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
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

        values = []
        for field_el in elem.findall("./field"):
            caption_el = field_el.find(".//caption/value/text")
            if caption_el is not None and caption_el.text:
                values.append(caption_el.text.strip())

        if values:
            self.enum_maps[name] = {str(i + 1): v for i, v in enumerate(values)}
            for i, v in enumerate(values):
                self.label_to_enum[v.strip()] = (name, str(i + 1))
        return None

    # other handle_* remain no-ops
    def handle_checkbox(self, *_):
        return None

    def handle_object_array(self, *_):
        return None

    def handle_group(self, *_):
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

    def __del__(self):
        print(
            f"EnumMapFactory collected {len(self.enum_maps)} enumeration maps "
            f"and {len(self.label_to_enum)} label links."
        )
