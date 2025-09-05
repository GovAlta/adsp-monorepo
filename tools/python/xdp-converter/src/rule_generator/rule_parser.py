import re
from typing import Dict, Optional, Set
from rule_generator.regular_expressions import (
    BANG_WRAP_RE,
    COND_EQ_ANY_LHS_RE,
    COND_EQ_RE,
    COND_NE_ANY_LHS_RE,
)
from xdp_parser.xdp_utils import name_to_scope, string_to_number, strip_not


def _split_top_level(expr: str, sep: str):
    out, depth, start = [], 0, 0
    i = 0
    while i < len(expr):
        ch = expr[i]
        if ch == "(":
            depth += 1
            i += 1
            continue
        if ch == ")":
            depth -= 1
            i += 1
            continue
        if depth == 0 and expr.startswith(sep, i):
            out.append(expr[start:i])
            i += len(sep)
            start = i
            continue
        i += 1
    out.append(expr[start:])
    return [p.strip() for p in out if p.strip()]


def _parse_atom(s: str):
    s = s.strip().rstrip(";").strip()
    m = COND_EQ_ANY_LHS_RE.match(s)
    if m:
        lhs = m.group("lhs")
        raw = (m.group("val") or "").strip()
        try:
            val = int(raw)
        except ValueError:
            try:
                val = float(raw)
            except ValueError:
                val = raw
        return ("ATOM", (lhs, val))
    m = COND_NE_ANY_LHS_RE.match(s)
    if m:
        lhs = m.group("lhs")
        raw = (m.group("val") or "").strip()
        try:
            val = int(raw)
        except ValueError:
            try:
                val = float(raw)
            except ValueError:
                val = raw
        return ("NOT", ("ATOM", (lhs, val)))
    m = BANG_WRAP_RE.match(s)
    if m:
        inner = m.group("inner")
        node = _parse_bool_expr(inner)
        return ("NOT", node)
    return None  # unsupported leaf


def _parse_bool_expr(expr: str):
    s = expr.strip()
    # OR at top level
    parts = _split_top_level(s, "||")
    if len(parts) > 1:
        return ("OR", [_parse_bool_expr(p) for p in parts])
    # AND at top level
    parts = _split_top_level(s, "&&")
    if len(parts) > 1:
        return ("AND", [_parse_bool_expr(p) for p in parts])
    # grouped
    if s.startswith("(") and s.endswith(")"):
        return _parse_bool_expr(s[1:-1])
    # leaf
    return _parse_atom(s)


# when converting a SINGLE atom (lhs == value)
def _atom_schema(
    lhs: str,
    val,
    group_to_label: Dict[str, Dict[str, str]] | None,
    member_to_group: Dict[str, str] | None,
):
    if member_to_group and lhs in member_to_group and str(val) == "1":
        g = member_to_group[lhs]
        label = group_to_label.get(g, {}).get(lhs, lhs)
        return {"properties": {g: {"const": label}}}
    # default checkbox atom:
    return {"properties": {lhs: {"const": val}}}


def node_to_rule(node, group_to_label, member_to_group):
    if node is None:
        return None
    kind = node[0]
    if kind == "ATOM":
        lhs, val = node[1]
        return _atom_schema(lhs, val, group_to_label, member_to_group)
    if kind == "NOT":
        child = node_to_rule(node[1], group_to_label, member_to_group)
        return {"not": child} if child else None
    if kind == "AND":
        subs = [node_to_rule(n, group_to_label, member_to_group) for n in node[1]]
        subs = [s for s in subs if s]
        return {"allOf": subs} if subs else None
    if kind == "OR":
        # When ORing atoms from the same group, coalesce into enum
        subs = []
        enums_by_group: Dict[str, Set[str]] = {}
        for n in node[1]:
            s = node_to_rule(
                n, group_to_label=group_to_label, member_to_group=member_to_group
            )
            if not s:
                continue
            # try to detect {"properties":{G:{"const": label}}}
            props = s.get("properties", {})
            if len(props) == 1:
                ((prop_name, prop_schema),) = props.items()
                if "const" in prop_schema:
                    enums_by_group.setdefault(prop_name, set()).add(
                        prop_schema["const"]
                    )
                    continue
            subs.append(s)
        # turn grouped consts into enum schemas
        for g, labels in enums_by_group.items():
            subs.append({"properties": {g: {"enum": sorted(labels)}}})
        return {"anyOf": subs} if subs else None
    return None


def to_single_condition_rule(cond_str: str, driver: Optional[str]) -> Optional[dict]:
    if cond_str == "ALWAYS":
        return None

    # unwrap NOT(...)
    base, is_neg = strip_not(cond_str)

    m = COND_EQ_RE.match(base)
    if not m:
        return None

    lhs = m.group("lhs")  # 'this' or a field name like 'chkAdditional'
    raw_value = (m.group("val") or "").strip()

    val = string_to_number(raw_value)

    # If LHS is an explicit field, prefer it as the driver
    effective_driver = driver
    if lhs != "this":
        effective_driver = lhs

    if not effective_driver:
        return None

    scope = name_to_scope(effective_driver)
    if not scope:
        return None

    base_cond = {"scope": scope, "schema": {"const": val}}
    return {"not": base_cond} if is_neg else base_cond


def to_multi_condition_rule(
    condition: str,
    driver: Optional[str],
    group_to_button_map,
    button_to_group_map,
) -> Optional[dict]:
    if not condition or condition == "ALWAYS":
        return None
    s = re.sub(r"\bthis\b", driver, condition) if driver else condition
    node = _parse_bool_expr(s)
    schema = node_to_rule(node, group_to_button_map, button_to_group_map)
    if not schema:
        return None
    return {"scope": "#", "schema": schema}
