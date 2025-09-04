import xml.etree.ElementTree as ET
from typing import Dict, List

from rule_generator.normalize_rules import ElementRules, _collect_rules_from_script, _iter_all_scripts_with_owner, build_presence_index, normalize_rules, to_jsonforms_rules

# --- assume: Rule, ElementRules, and all helpers from earlier are already defined ---
# (build_presence_index, _iter_all_scripts_with_owner, _collect_rules_from_script,
#  normalize_rules, to_jsonforms_rules, etc.)

def parse_all_scripts_to_element_rules_from_root(root: ET.Element) -> Dict[str, ElementRules]:
    """
    Collect presence-only rules from every <script> in an existing ElementTree root.
    Returns: { target_name: ElementRules }
    """
    rules_map: Dict[str, ElementRules] = {}
    for script_txt, owner in _iter_all_scripts_with_owner(root):
        _collect_rules_from_script(script_txt, owner, rules_map)
    return rules_map

def process_xdp_root_for_jsonforms_rules(
    root: ET.Element,
    name_to_pointer,
) -> Dict[str, List[dict]]:
    """
    New entry point: accepts an ElementTree root, builds defaults, normalizes,
    and emits JSONForms rules.
    """
    rules_map = parse_all_scripts_to_element_rules_from_root(root)
    presence_index = build_presence_index(root)
    get_default_presence = lambda name: presence_index.get(name, "visible")
    normalize_rules(rules_map, get_default_presence)
    return to_jsonforms_rules(rules_map, name_to_pointer)

# (Optional) Backward-compatible wrapper if you still pass strings sometimes.
def process_xdp_for_jsonforms_rules(
    xdp_fragment: str,
    name_to_pointer,
) -> Dict[str, List[dict]]:
    """
    Legacy wrapper: accepts a string/fragment, parses it to an ElementTree root,
    then delegates to process_xdp_root_for_jsonforms_rules.
    """
    try:
        root = ET.fromstring(xdp_fragment)
    except ET.ParseError:
        root = ET.fromstring(f"<root>{xdp_fragment}</root>")
    return process_xdp_root_for_jsonforms_rules(root, name_to_pointer)