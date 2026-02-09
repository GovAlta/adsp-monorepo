from schema_generator.form_element import FormElement
from schema_generator.form_control_with_help import FormControlWithHelp
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_layout import XdpLayout
from xdp_parser.xdp_element import XdpElement

debug = False


class XdpHelpControlPair(XdpLayout):
    def __init__(self, help_elem: XdpHelpText, control_elem: XdpElement, context):
        super().__init__(
            help_elem.xdp_element, "VerticalLayout", [help_elem, control_elem]
        )
        self.context = context
        self.control_elem = control_elem
        self.help_elem = help_elem
        if debug:
            name = control_elem.get_name()
            text = help_elem.help_text()
            print(f"[XdpHelpControlPair] Created pair: {name} -> {text}")

    @property
    def control(self) -> XdpElement:
        return self.control_elem

    @property
    def help(self) -> XdpElement:
        return self.help_elem

    def is_control(self) -> bool:
        return self.control_elem.is_control()

    def footprint(self):
        return self.control.footprint()

    def to_form_element(self) -> FormElement:
        return FormControlWithHelp(self.control_elem, self.help_elem, self.context)
