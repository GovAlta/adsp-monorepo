from typing import List, Optional
from schema_generator.form_categorization import FormCategorization
from schema_generator.form_element import FormElement
from schema_generator.form_layout import FormLayout


class UiSchemaGenerator:
    def __init__(self, categories: List[FormElement], rules: Optional[dict] = None):
        self.categories = categories
        self.rules = rules

    def to_schema(self):
        categorization = FormCategorization(self.categories)
        return categorization.to_ui_schema(self.rules)
