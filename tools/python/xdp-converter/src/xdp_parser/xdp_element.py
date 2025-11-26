# This class represents an XDP fragment that describes a form element
from abc import ABC, abstractmethod
from importlib.resources.readers import remove_duplicates

from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_utils import (
    compute_full_xdp_path,
    split_camel_case,
    strip_label_prefix,
)


class XdpElement(ABC):
    def __init__(self, xdp, labels=None, context: ParseContext = None):
        self.xdp_element = xdp
        self.labels = labels
        self.context = context or {}
        self.parent_map = context.get("parent_map", {}) if context else {}

    def get_full_path(self) -> str:
        return compute_full_xdp_path(self.xdp_element, self.parent_map)

    @property
    def full_path(self) -> str:
        """Cached version for quick repeated access."""
        if not hasattr(self, "_full_path_cache"):
            self._full_path_cache = self.get_full_path()
        return self._full_path_cache

    @abstractmethod
    def to_form_element(self) -> FormElement:
        pass

    def get_type(self):
        return "string"

    def extract_coordinate(self, coordinate):
        value = self.xdp_element.get(coordinate, "0")
        if isinstance(value, str) and "mm" in value:
            value = value.replace("mm", "")
        try:
            return float(value)
        except ValueError:
            return 0.0

    def get_name(self):
        return self.xdp_element.get("name", "")

    def get_label(self):
        label = None
        if self.labels:
            label = self.labels.get(self.get_name())
        if not label:
            label = strip_label_prefix(self.get_name())
            if label:
                label = split_camel_case(label)
        return label

    def get_enumeration_values(self):
        """
        Return de-duped human-readable choices from <items><text>...</text></items>,
        ignoring any <items> blocks with presence="hidden".
        """
        enum_values = []

        # Find all <items> under this field (assumes namespaces stripped; if not, use a ns map)
        for items_el in self.xdp_element.findall(".//items"):
            presence = (items_el.attrib.get("presence") or "").strip().lower()
            if presence == "hidden":
                continue  # skip saved-value list

            # Collect the human-readable labels
            for text_el in items_el.findall("./text"):
                txt = "".join(text_el.itertext()).strip()
                if txt:
                    enum_values.append(txt)

        if enum_values:
            # keep your existing stable-order de-dupe
            return [str(v) for v in remove_duplicates(enum_values)]
        return None

    def get_format(self):
        isDate = matches_prefix(self.get_name(), "dte")
        if isDate:
            return "date"
        return None


def matches_prefix(candidate: str, prefix: str) -> bool:
    if not candidate or not prefix:
        return False
    if len(prefix) > len(candidate):
        return False
    return candidate[: len(prefix)] == prefix


def get_caption_text(xdp_element):
    caption_value_elem = xdp_element.find(".//caption/value")

    if caption_value_elem is not None:
        # Get all text content from the value and its children
        caption_text = "".join(caption_value_elem.itertext()).strip()
        if caption_text:
            return caption_text

    return None
