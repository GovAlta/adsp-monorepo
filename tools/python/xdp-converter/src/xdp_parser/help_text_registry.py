import xml.etree.ElementTree as ET

from xdp_parser.help_text_parser import JSHelpTextParser


#
# Singleton registry for help messages parsed from <variables> node.
# Usage: HelpMessageRegistry.get(key: str) -> str
class HelpTextRegistry:
    _instance = None

#     def __init__(self, registry: dict):
#         self.registry = registry

    def load_messages(self, tree: ET.Element):
        """Parse <variables> node and store messages dict."""
        message_parser = JSHelpTextParser(tree)
        self._messages = message_parser.get_messages()

#     def hasAnnotation(self, key: str) -> bool:
#         """Check if a help message exists for a control name."""
#         return key in self.registry