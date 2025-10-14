import re
from schema_generator.annotated_control import AnnotatedControl
from schema_generator.form_information import FormInformation
from schema_generator.form_layout import FormLayout
from xdp_parser.control_label import ControlLabels
from xdp_parser.parsing_helpers import split_label_and_help
from xdp_parser.xdp_element import XdpElement


# An XDP subform may contain multiple radio buttons representing a single selector
class XdpRadioSelector(XdpElement):
    def __init__(self, xdp_element, options, messages: ControlLabels):
        super().__init__(xdp_element)
        self.options = options
        self.is_leaf = True
        self.messages = messages

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
        control = AnnotatedControl([radio_buttons, self.messages])
        control.enum = []
        for option in self.options:
            label, _ = split_label_and_help(option)
            control.enum.append(label)
        return control

    def _to_help_messages(self):
        options = []
        for option in self.options:
            if self.messages.hasAnnotation(option):
                help_text = self.messages.getAnnotation(option)
                info = FormInformation(self.get_name(), help_text, option, hidden=True)
                options.append(info)
        return FormLayout("VerticalLayout", options)

    def get_enumeration_values(self):
        return self.options

    def has_annotation(self) -> bool:
        for option in self.options:
            if self.messages.hasAnnotation(option):
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
