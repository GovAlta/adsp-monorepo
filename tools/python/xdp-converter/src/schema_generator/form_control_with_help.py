from schema_generator.form_element import FormElement, JsonSchemaElement
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class FormControlWithHelp(FormElement):
    def __init__(
        self, control: XdpElement, help_text: XdpElement, context: ParseContext
    ):
        super().__init__("Control with help", None, None, context)
        self.type = type
        self.control: FormElement = self.get_modified_control(control, help_text)

    def build_ui_schema(self) -> JsonSchemaElement:
        return self.control.build_ui_schema()

    def has_json_schema(self) -> bool:
        # if self.control.has_json_schema():
        #     print(f"{self.control.name} DATA schema found")
        # else:
        #     print(f"{self.control.name} DATA schema NOT found")
        return self.control.has_json_schema()

    def to_json_schema(self) -> JsonSchemaElement:
        #        print(f"    writing data schema for {self.control.name}")
        return self.control.to_json_schema()

    def get_modified_control(self, control: XdpElement, _: XdpElement) -> FormElement:
        fe = control.to_form_element()
        if control.get_label():
            label = f"{control.get_label().label} ℹ️"
            fe.update_label(label)
        return fe
