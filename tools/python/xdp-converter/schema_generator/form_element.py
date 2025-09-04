from abc import abstractmethod

# Abstract form element, can be one of FormInput or Guidance
class FormElement:
    def __init__(self, type: str):
        self.type = type
        self.is_leaf = True

    @abstractmethod
    def has_json_schema():
        pass
    
    @abstractmethod
    def to_json_schema():
        pass

    @abstractmethod
    def to_ui_schema():
        pass
