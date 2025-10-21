# This class represents an XDP fragment that describes a form element
from abc import ABC, abstractmethod
from importlib.resources.readers import remove_duplicates

from schema_generator.form_element import FormElement
from schema_generator.form_input import FormInput
from xdp_parser.xdp_utils import split_camel_case, strip_label_prefix


class XdpElement(ABC):
    def __init__(self, xdp, labels=None):
        self.xdp_element = xdp
        self.labels = labels

    @abstractmethod
    def to_form_element(self) -> FormElement:
        fe = FormInput(self.get_name(), self.get_type(), self.get_label())
        fe.x = self.extract_coordinate("x")
        fe.y = self.extract_coordinate("y")
        fe.enum = self.get_enumeration_values()
        fe.label = self.get_label()
        fe.format = self.get_format()
        return fe

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
