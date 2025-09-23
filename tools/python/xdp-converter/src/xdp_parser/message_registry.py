import xml.etree.ElementTree as ET

from xdp_parser.message_parser import JSHelpMessageParser
from xdp_parser.node_finder import NodeFinder


#
# Singleton registry for help messages parsed from <variables> node.
# Usage: HelpMessageRegistry.get(key: str) -> str
class HelpMessageRegistry:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._messages = {}
        return cls._instance

    def load_messages(self, tree: ET.Element):
        """Parse <variables> node and store messages dict."""
        message_parser = JSHelpMessageParser(tree)
        self._messages = message_parser.get_messages()

    def getAnnotation(self, key: str) -> str:
        """Fetch help message for a control name."""
        return self._messages.get(key)

    def hasAnnotation(self, key: str) -> bool:
        """Check if a help message exists for a control name."""
        return key in self._messages

    def all(self) -> dict:
        """Return full messages dict (read-only)."""
        return dict(self._messages)
