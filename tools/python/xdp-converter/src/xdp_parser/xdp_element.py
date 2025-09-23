# This class represents an XDP fragment that describes a form element
from abc import ABC, abstractmethod
from importlib.resources.readers import remove_duplicates

from schema_generator.form_element import FormElement
from schema_generator.form_input import FormInput
from xdp_parser.xdp_utils import split_camel_case, strip_label_prefix


class XdpElement(ABC):
    def __init__(self, xdp):
        self.xdp_element = xdp

    @abstractmethod
    def to_form_element(self) -> FormElement:
        fe = FormInput(self.get_name(), self.get_type())
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
        caption = get_caption_text(self.xdp_element)
        if caption:
            return caption

        label = strip_label_prefix(self.get_name())
        if label:
            return split_camel_case(label)

        return None

    def get_enumeration_values(self):
        items = self.xdp_element.findall(".//items/text")
        enum = [str(item.text) for item in items if item.text]
        if len(enum) > 0:
            deduped = [str(val) for val in remove_duplicates(enum)]
            return deduped
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
    # Get namespace
    if xdp_element.tag.startswith("{"):
        uri = xdp_element.tag.split("}")[0].strip("{")
        ns = {"xfa": uri}
        xpath = ".//xfa:caption/xfa:value"
        caption_value_elem = xdp_element.find(xpath, namespaces=ns)
    else:
        caption_value_elem = xdp_element.find(".//caption/value")

    if caption_value_elem is not None:
        # Get all text content from the value and its children
        caption_text = "".join(caption_value_elem.itertext()).strip()
        if caption_text:
            return caption_text

    return None
