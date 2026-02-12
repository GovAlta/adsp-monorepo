from schema_generator.annotated_control import AnnotatedControl
from schema_generator.form_information import FormInformation
from schema_generator.form_input import FormInput
from schema_generator.form_layout import FormLayout
from xdp_parser.control_labels import ControlLabels
from xdp_parser.help_text_registry import HelpTextRegistry
from xdp_parser.parsing_helpers import split_label_and_help
from xdp_parser.xdp_element import XdpElement


# An XDP subform may contain multiple radio buttons representing a single selector
class XdpPseudoRadio(XdpElement):
    def __init__(self, xdp_element, options, messages: ControlLabels):
        super().__init__(xdp_element)
        self.options = options
        self.is_leaf = True
        self.messages = messages
        self.option_description_by_value: dict[str, str] = {}
        self.option_detail_help_by_value: dict[str, str] = {}
        self.checkbox_to_value: dict[str, str] = {}

    def is_control(self):
        return True

    def to_form_element(self):
        if self.has_annotation():
            return self._to_annotated_control()
        else:
            return self._to_simple_control()

    def _to_simple_control(self):
        fe = FormInput(
            self.xdp_element.get("name", ""),
            self.full_path,
            self.get_type(),
            self.get_label(),
            self.context,
        )
        fe.enum = self.options
        fe.is_radio = True
        return fe

    def _to_annotated_control(self):
        radio_buttons = self._to_simple_control()
        control = AnnotatedControl(
            [radio_buttons, self._to_help_messages()], self.context
        )
        control.enum = []
        for option in self.options:
            display_text = split_label_and_help(option)
            control.enum.append(display_text.label)
        return control

    def _to_help_messages(self):
        options = []
        registry = HelpTextRegistry()
        for option in self.options:
            if registry.has_annotation(option):
                help_text = registry.get_annotation(option)
                info = FormInformation(
                    self.get_name(),
                    help_text,
                    option,
                    hidden=True,
                    context=self.context,
                )
                options.append(info)
        return FormLayout("VerticalLayout", options, self.context)

    def get_enumeration_values(self):
        return self.options

    def has_annotation(self) -> bool:
        for option in self.options:
            if HelpTextRegistry().has_annotation(option):
                return True
        return False


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
        if child.tag == "field":
            has_radio = any(
                cb.tag == "checkButton" and cb.attrib.get("mark") == "circle"
                for cb in child.iter()
            )
            if has_radio:
                j = i + 1
                while j < len(children):
                    next_elem = children[j]
                    if next_elem.tag == "draw":
                        label = find_button_label(next_elem)
                        if label:
                            labels.append(label[0])
                        break
                    j += 1
        i += 1

    return labels


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
