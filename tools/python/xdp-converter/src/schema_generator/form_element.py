from abc import ABC, abstractmethod

from constants import CTX_JSONFORMS_RULES
from xdp_parser.parse_context import ParseContext


# Abstract form element, can be one of FormInput or Guidance
class FormElement(ABC):
    def __init__(self, type: str, name, qualified_name, context: ParseContext):
        self.type = type
        self.name = name
        self.qualified_name = qualified_name
        self.context = context
        self.is_leaf = True
        self.y = 0
        self.x = 0
        self.is_radio = False
        self.label = None
        self.format = None
        self.enum = None
        self.children = None
        self.can_group_horizontally = True

    @abstractmethod
    def has_json_schema(self):
        pass

    @abstractmethod
    def to_json_schema():
        pass

    @abstractmethod
    def build_ui_schema():
        pass

    def _find_visibility_rule(self, rules: dict) -> dict | None:
        fq = getattr(self, "qualified_name", None)

        # No path? No rule.
        if not fq:
            return None

        # Direct match
        if fq in rules:
            return rules[fq]

        # Prefix match (rule applies to a parent subform)
        for key, rule in rules.items():
            if key and fq.startswith(key + "."):
                return rule
        return None

    def to_ui_schema(self):
        schema = self.build_ui_schema()
        if not schema:
            return None
        rules = self.context.get(CTX_JSONFORMS_RULES) or {}
        rule_entry = self._find_visibility_rule(rules)
        if rule_entry is not None:
            schema["rule"] = rule_entry["rule"]
        return schema

    def _debug_rule_matching(self, rules: dict):
        """
        Diagnostic: print all rule keys that might match this element.
        Helps understand why visibility rules attach or fail to attach.
        """

        qname = self.qualified_name or ""
        short = qname.split(".")[-1] if qname else ""

        substring_hits = []
        suffix_hits = []
        exact_hits = []

        for key in rules.keys():
            # Exact match on full qualified name
            if key == qname:
                exact_hits.append(key)

            # Match by suffix (last part of dotted name)
            if key.split(".")[-1] == short:
                suffix_hits.append(key)

            # Any substring match (wide net — diagnostics only)
            if qname and qname in key:
                substring_hits.append(key)

        print("  --- Candidate matches ---")

        print(f"  Exact matches ({len(exact_hits)}):")
        for k in exact_hits:
            print(f"    • {k}")

        print(f"  Suffix matches ({len(suffix_hits)}):")
        for k in suffix_hits:
            print(f"    • {k}")

        print(f"  Substring matches ({len(substring_hits)}):")
        for k in substring_hits:
            print(f"    • {k}")

        print("  -------------------------\n")
