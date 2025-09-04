from __future__ import annotations
import re
from typing import List, Optional

from xdp_parser.xdp_utils import name_to_scope, string_to_value

class Rule:
    def __init__(self, effect: str, target: str, value: str, controller: Optional[str] = None):
        self.effect = effect
        self.target = target
        self.schema_value = value
        self.controller = controller

    def __repr__(self):
        return f"\nRule(effect={self.effect!r}, target={self.target!r}, value={self.schema_value!r}, controller={self.controller!r})"

class ElementRules:
    def __init__(self, element_name: str):
        self.element_name = element_name
        self.rules: List[Rule] = []

    def add_rule(self, rule: Rule):
        self.rules.append(rule)

    def __repr__(self):
        return f"\nElementRules({self.element_name!r}, rules={self.rules!r})"
    
    # if (this.rawValue==const)
    _SIMPLE_THIS_EQ_RE = re.compile(r"""^\s*this\.rawValue\s*==\s*("?)(?P<val>[^"]+)\1\s*$""")

    def get_condition(self, value: str, controller: Optional[str]) -> Optional[dict]:
        """
        Turn "this.rawValue == 1" into:
        { "scope": "#/properties/<controller>", "schema": { "const": 1 } }
        and NOT(...) into a "not" wrapper.
        Returns None if we can't parse it 
        """
        if value == "ALWAYS":
            # JSONForms doesn't have an "always true" rule; callers can omit the condition entirely
            return None

        negated = False
        cond = value
        match_not = re.match(r"^\s*NOT\((.*)\)\s*$", value)
        if match_not:
            negated = True
            cond = match_not.group(1).strip()

        match_equal = self._SIMPLE_THIS_EQ_RE.match(cond)
        if not match_equal or not controller:
            return None

        val = string_to_value(match_equal.group("val"))
        scope = name_to_scope(controller)
        if not scope:
            return None

        base = {"scope": scope, "schema": {"const": val}}
        return {"not": base} if negated else base
