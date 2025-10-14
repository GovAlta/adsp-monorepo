# import xml.etree.ElementTree as ET

# from xdp_parser.message_parser import JSHelpMessageParser


#
# Singleton registry for help messages parsed from <variables> node.
# Usage: HelpMessageRegistry.get(key: str) -> str
# class HelpMessageRegistry:

#     def __init__(self, registry: dict):
#         self.registry = registry

#     def getAnnotation(self, key: str) -> str:
#         """Fetch help message for a control name."""
#         return self.registry.get(key)

#     def hasAnnotation(self, key: str) -> bool:
#         """Check if a help message exists for a control name."""
#         return key in self.registry
