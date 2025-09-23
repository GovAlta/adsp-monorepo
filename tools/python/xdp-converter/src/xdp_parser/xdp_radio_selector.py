import re
from schema_generator.annotated_control import AnnotatedControl
from schema_generator.form_information import FormInformation
from schema_generator.form_layout import FormLayout
from xdp_parser.message_registry import HelpMessageRegistry
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import strip_namespace


# An XDP subform may contain multiple radio buttons representing a single selector
class XdpRadioSelector(XdpElement):
    def __init__(self, xdp_element, options):
        super().__init__(xdp_element)
        self.options = options
        self.is_leaf = True

    def to_form_element(self):
        if self.has_annotation():
            return self._to_annotated_control()
        else:
            return self._to_simple_control()

    def _to_simple_control(self):
        fe = super().to_form_element()
        fe.is_radio = True
        return fe

    def _to_annotated_control(self):
        radio_buttons = self._to_simple_control()
        messages = self._to_help_messages()
        control = AnnotatedControl([radio_buttons, messages])
        control.enum = []
        for option in self.options:
            label, help_text = split_label_and_help(option)
            control.enum.append(label)
        return control

    def _to_help_messages(self):
        options = []
        registry = HelpMessageRegistry()
        for option in self.options:
            if registry.hasAnnotation(option):
                help_text = registry.getAnnotation(option)
                info = FormInformation(self.get_name(), help_text, option, hidden=True)
                options.append(info)
        return FormLayout("VerticalLayout", options)

    def get_enumeration_values(self):
        return self.options

    def has_annotation(self) -> bool:
        for option in self.options:
            if HelpMessageRegistry().hasAnnotation(option):
                return True
        return False


def extract_radio_button_labels(subform_elem):
    """
    Returns a list of radio button labels found in the subform.
    Looks for <field> with <checkButton mark="circle">, then finds the next <draw> and extracts its label.
    """
    children = list(subform_elem)
    labels = []
    i = 0
    while i < len(children):
        child = children[i]
        if strip_namespace(child.tag) == "field":
            has_radio = any(
                strip_namespace(cb.tag) == "checkButton"
                and cb.attrib.get("mark") == "circle"
                for cb in child.iter()
            )
            if has_radio:
                j = i + 1
                while j < len(children):
                    next_elem = children[j]
                    if strip_namespace(next_elem.tag) == "draw":
                        label = find_button_label(next_elem)
                        if label:
                            labels.append(label[0])
                        break
                    j += 1
        i += 1

    return labels


def has_checkbox_elements(draw):
    return [
        cb
        for cb in draw.iter()
        if cb.tag.endswith("checkButton") and cb.attrib.get("mark") == "circle"
    ]


def get_scripted_annotation(draw):
    help_script = [s for s in draw.iter() if s.tag.endswith("script")]
    has_information_icon = has_checkbox_elements(draw)
    if help_script and has_information_icon:
        return help_script[0].text if help_script[0].text else None
    return None


def find_button_label(draw):
    value_elem = None
    for elem in draw:
        if elem.tag.endswith("value"):
            value_elem = elem
            break
    if value_elem is not None:
        text_elem = None
        for elem in value_elem:
            if elem.tag.endswith("text"):
                text_elem = elem
                break
        if text_elem is not None and text_elem.text:
            return split_label_and_help(text_elem.text.strip())


def split_label_and_help(label_text, min_space_count=2):
    """
    Splits label_text into (label, help_text) using min_space_count consecutive spaces as separator.
    Returns (label, help_text). If no separator found, help_text is ''.
    """
    # Build regex for min_space_count spaces
    pattern = r"\s{" + str(min_space_count) + r",}"
    parts = re.split(pattern, label_text, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    else:
        return label_text.strip(), ""
