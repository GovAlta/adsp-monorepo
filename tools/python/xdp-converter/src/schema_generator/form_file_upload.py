from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_utils import strip_label_prefix


class FormFileUpload(FormElement):
    def __init__(
        self,
        name: str,
        qualified_name,
        input_type: str,
        label: str,
        context: ParseContext,
    ):
        super().__init__("control", name, qualified_name, context)
        self.input_type: str = input_type
        self.format: str = "file-urn"
        self.is_radio = False
        self.label: str = label

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        json_schema = {"type": self.input_type}
        if self.label:
            json_schema["title"] = strip_label_prefix(self.label)
        json_schema["format"] = "file-urn"
        return json_schema

    def build_ui_schema(self):
        control = {"type": "Control", "scope": f"#/properties/{self.name}"}
        control["label"] = strip_label_prefix(self.label) if self.label else ""
        control["options"] = {"variant": "dragdrop"}
        return control
