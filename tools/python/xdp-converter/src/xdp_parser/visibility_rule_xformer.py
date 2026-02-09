from visibility_rules.pipeline_context import CTX_JSONFORMS_RULES
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_pseudo_radio import XdpPseudoRadio

###
# Visibility rules are currently stored as Json Schemas.  This is great for emitting
# them into the final UI-schema, but makes it hard to modify them when needed.  The
# fix would be to use a proper data structure to store the rules, but that would take
# a complete rewrite of the rule generator (not a bad idea, but expensive).
#
# As a temporary fix, we will convert the json schema's into easily modified data
# structures, do the modifications as needed, and then transform them back into
# Json Schemas
###


class _Cond:
    def rewrite(self, mapping: dict[str, tuple[str, str]]) -> "_Cond":
        return self

    def to_schema(self) -> dict:
        raise NotImplementedError


class _Eq(_Cond):
    def __init__(self, driver: str, value: str):
        self.driver = driver
        self.value = value

    def rewrite(self, mapping: dict[str, tuple[str, str]]) -> _Cond:
        if self.value == "1" and self.driver in mapping:
            new_driver, new_value = mapping[self.driver]
            return _Eq(new_driver, new_value)
        return self

    def to_schema(self) -> dict:
        return {
            "properties": {self.driver: {"const": self.value}},
            "required": [self.driver],
        }


class _Or(_Cond):
    def __init__(self, items: list[_Cond]):
        self.items = items

    def rewrite(self, mapping: dict[str, tuple[str, str]]) -> _Cond:
        return _Or([c.rewrite(mapping) for c in self.items])

    def to_schema(self) -> dict:
        return {"anyOf": [c.to_schema() for c in self.items]}


class _And(_Cond):
    def __init__(self, items: list[_Cond]):
        self.items = items

    def rewrite(self, mapping: dict[str, tuple[str, str]]) -> _Cond:
        return _And([c.rewrite(mapping) for c in self.items])

    def to_schema(self) -> dict:
        return {"allOf": [c.to_schema() for c in self.items]}


class _Not(_Cond):
    def __init__(self, node: _Cond):
        self.node = node

    def rewrite(self, mapping: dict[str, tuple[str, str]]) -> _Cond:
        return _Not(self.node.rewrite(mapping))

    def to_schema(self) -> dict:
        return {"not": self.node.to_schema()}


def _rule_from_jsonforms(rule_obj: dict) -> tuple[str, _Cond]:
    effect = rule_obj.get("effect")
    cond = rule_obj.get("condition") or {}
    schema = cond.get("schema") or {}
    if not isinstance(effect, str) or not isinstance(schema, dict):
        raise ValueError("Unsupported rule object")
    return effect, _cond_from_schema(schema)


def _rule_to_jsonforms(effect: str, cond: _Cond) -> dict:
    return {
        "effect": effect,
        "condition": {
            "scope": "#",
            "schema": cond.to_schema(),
        },
    }


def _cond_from_schema(schema: dict) -> _Cond:
    if "anyOf" in schema and isinstance(schema["anyOf"], list):
        return _Or(
            [_cond_from_schema(s) for s in schema["anyOf"] if isinstance(s, dict)]
        )

    if "allOf" in schema and isinstance(schema["allOf"], list):
        return _And(
            [_cond_from_schema(s) for s in schema["allOf"] if isinstance(s, dict)]
        )

    if "not" in schema and isinstance(schema["not"], dict):
        return _Not(_cond_from_schema(schema["not"]))

    props = schema.get("properties")
    req = schema.get("required")

    # Atomic: {properties:{X:{const:V}}, required:[X]}
    if isinstance(props, dict) and isinstance(req, list):
        if len(props) == 1 and len(req) == 1:
            ((drv, drv_schema),) = props.items()
            if req[0] != drv:
                raise ValueError("required/properties mismatch")
            if isinstance(drv_schema, dict) and "const" in drv_schema:
                return _Eq(str(drv), str(drv_schema.get("const")))
            raise ValueError("Unsupported atomic driver schema")

        # Conservative: treat merged multi-property objects as AND of atomics we can parse.
        items: list[_Cond] = []
        for drv, drv_schema in props.items():
            if drv in req:
                items.append(
                    _cond_from_schema(
                        {"properties": {drv: drv_schema}, "required": [drv]}
                    )
                )
        return _And(items)

    raise ValueError("Unsupported schema node")


def _get_rules_dict(context) -> dict:
    # Context is a dict; we keep a small fallback for older keys.
    rules = context.get(CTX_JSONFORMS_RULES)
    if isinstance(rules, dict):
        return rules
    rules = context.get("jsonforms_rules")
    if isinstance(rules, dict):
        return rules
    return {}


def rewrite_rules_after_pseudo_radio_transform(
    children: list[XdpElement], context
) -> None:
    rules = _get_rules_dict(context)
    if not rules:
        return

    # Build checkbox -> (radio_driver, radio_value) mapping for all radios in this subform
    mapping: dict[str, tuple[str, str]] = {}

    for e in children:
        if not isinstance(e, XdpPseudoRadio):
            continue

        radio_name = (e.get_name() or "").strip()
        if not radio_name:
            continue

        cb_map = e.checkbox_to_value
        if not cb_map:
            continue

        for chk_name, radio_value in cb_map.items():
            chk = (str(chk_name) or "").strip()
            val = (str(radio_value) or "").strip()
            if chk and val:
                mapping[chk] = (radio_name, val)

    if not mapping:
        return

    # Rewrite each rule in-place (fail-soft on unknown shapes)
    for entry in rules.values():
        if not isinstance(entry, dict):
            continue

        rule_obj = entry.get("rule")
        if isinstance(rule_obj, dict) and "effect" in rule_obj:
            try:
                effect, cond = _rule_from_jsonforms(rule_obj)
                cond2 = cond.rewrite(mapping)
                entry["rule"] = _rule_to_jsonforms(effect, cond2)
            except Exception:
                # Leave unchanged if rule shape is outside our supported subset
                continue
        elif isinstance(entry, dict) and "effect" in entry:
            # Support the older shape where the rule dict is stored directly
            try:
                effect, cond = _rule_from_jsonforms(entry)
                cond2 = cond.rewrite(mapping)
                new_rule = _rule_to_jsonforms(effect, cond2)
                entry.clear()
                entry.update(new_rule)
            except Exception:
                continue
