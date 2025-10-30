from schema_generator.form_element import FormElement
from schema_generator.form_layout import group_horizontally
from schema_generator.section_title import SectionTitle


##
#  A form section is a top level grouping of form elements.
# . In this case we are using a Vertical Layout, but it could be any layout
# . such as a Category within a Categorization.
##
class FormSection(FormElement):
    def __init__(self, name, qualified_name, title, elements):
        super().__init__("section", name, qualified_name)
        self.title = title
        # May need to remove the horizontal grouping if that
        # works better for the AIM refinement algorithms
        self.elements = group_horizontally(elements)
        self.is_leaf = False

    def build_ui_schema(self):
        ui_schema = {"type": "VerticalLayout"}
        ui_schema["label"] = self.title
        ui_schema["elements"] = [SectionTitle(self.title).to_ui_schema()]
        for element in self.elements:
            ui_schema["elements"].append(element.to_ui_schema())
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.elements:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
