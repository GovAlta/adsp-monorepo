import xml.etree.ElementTree as ET
from xdp_parser.help_text_parser import JSHelpTextParser


#
# Text used in (i) popup help massages is stored in the
# <variables> node (one below the root) of the XDP XML.
# Grab and put them into a dictionary for later use.
class HelpTextRegistry:
    def __init__(self):
        self._messages = {}

    def load_messages(self, tree: ET.Element):
        """Parse <variables> node and store messages dict."""
        message_parser = JSHelpTextParser(tree)
        self._messages = message_parser.get_messages()
