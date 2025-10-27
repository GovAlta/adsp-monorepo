import xml.etree.ElementTree as ET
from xdp_parser.help_text_parser import JSHelpTextParser


#
# Text used in (i) popup help massages is stored in the
# <variables> node (one below the root) of the XDP XML.
# Grab and put them into a dictionary for later use.
class HelpTextRegistry:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._messages = {}
        return cls._instance

    def load_messages(self, tree: ET.Element):
        """Parse <variables> node and store messages dict."""
        message_parser = JSHelpTextParser(tree)
        self._messages = message_parser.get_messages()

    def hasAnnotation(self, label: str) -> bool:
        return label in self._messages

    def getAnnotation(self, label: str) -> str:
        return self._messages.get(label, "")
