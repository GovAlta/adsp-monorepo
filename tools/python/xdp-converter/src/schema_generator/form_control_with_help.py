from typing import Optional

from schema_generator.form_element import FormElement, JsonSchemaElement, UISchema
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class FormControlWithHelp(FormElement):
    def __init__(
        self, control: XdpElement, help_text: XdpElement, context: ParseContext
    ):
        super().__init__("Control with help", control.get_name(), None, context)
        self.type = type
        self.control: Optional[FormElement] = self.get_modified_control(
            control, help_text
        )

    def build_ui_schema(self) -> Optional[UISchema]:
        return self.control.to_ui_schema() if self.control else None

    def has_json_schema(self) -> bool:
        return self.control.has_json_schema() if self.control else False

    def to_json_schema(self) -> list[JsonSchemaElement]:
        return self.control.to_json_schema() if self.control else []

    def get_modified_control(
        self, control: XdpElement, _: XdpElement
    ) -> Optional[FormElement]:
        fe = control.to_form_element()
        label = control.get_label()
        if fe is not None and label is not None:
            label = f"{label.label} ℹ️"
            fe.update_label(label)
        return fe
