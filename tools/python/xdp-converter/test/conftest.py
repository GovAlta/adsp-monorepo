import xml.etree.ElementTree as ET
import pytest
from src.rule_generator.normalize_rules import RulesParser


@pytest.fixture
def run_pipeline():
    def pointer(name: str) -> str | None:
        # naive mapping (tweak if your code expects None for unknowns)
        return f"#/properties/{name}"

    def _run(xdp: str, *, debug: bool = False):
        # Wrap fragments so ET can parse either a full XDP or a snippet
        try:
            root = ET.fromstring(xdp)
        except ET.ParseError:
            root = ET.fromstring(f"<root>{xdp}</root>")
        parser = RulesParser(root)
        return parser.extract_rules()

    return _run
