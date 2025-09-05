import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple
from xdp_parser.parse_selectors import build_choice_groups


# ----------------- Data classes -----------------
class Rule:
    def __init__(
        self,
        effect: str,
        target: str,
        condition_value: str,
        driver: Optional[str] = None,
    ):
        self.effect = effect  # "SHOW" | "HIDE"
        self.target = target  # element being affected
        self.condition_value = (
            condition_value  # e.g., 'this.rawValue == 1', 'NOT(...)', 'ALWAYS'
        )
        self.driver = driver  # owner whose event/script this is under

    def __repr__(self):
        return f"\nRule(effect={self.effect!r}, target={self.target!r}, condition_value={self.condition_value!r}, driver={self.driver!r})"


class ElementRules:
    def __init__(self, element_name: str):
        self.element_name = element_name
        self.rules: list[Rule] = []
        self._seen: set[tuple[str, str, str, str | None]] = set()
        # key = (effect, target, condition_value, driver)

    def add_rule(self, rule: Rule) -> bool:
        key = (rule.effect, rule.target, rule.condition_value, rule.driver)
        if key in self._seen:
            return False
        self._seen.add(key)
        self.rules.append(rule)
        return True

    def __repr__(self):
        return f"ElementRules({self.element_name!r}, rules={self.rules!r})"


# ----------------- Small utils -----------------
def _localname(tag: str) -> str:
    return tag.split("}", 1)[-1]


def _node_name(el: Optional[ET.Element]) -> Optional[str]:
    if el is None:
        return None
    return el.attrib.get("name") or el.attrib.get("id") or _localname(el.tag)


# presence mapping used later
_INTERESTING_NODE_NAMES = {
    "field",
    "subform",
    "exclGroup",
    "draw",
    "area",
    "subformSet",
}

import re

# Reuse your earlier regexes if you already have them:
COND_EQ_ANY_LHS_RE = re.compile(
    r"""^\s*\(*
        (?P<lhs>(?:this|[A-Za-z_]\w*))\s*\.\s*rawValue\s*
        (?:==|===)\s*
        (?P<q>["'])?(?P<val>[^"']+)(?P=q)?
        \)*\s*;?\s*$
    """,
    re.VERBOSE,
)

COND_NE_ANY_LHS_RE = re.compile(
    r"""^\s*\(*
        (?P<lhs>(?:this|[A-Za-z_]\w*))\s*\.\s*rawValue\s*
        !=\s*
        (?P<q>["'])?(?P<val>[^"']+)(?P=q)?
        \)*\s*;?\s*$
    """,
    re.VERBOSE,
)

BANG_WRAP_RE = re.compile(r"^\s*!\s*\((?P<inner>.*)\)\s*$")


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
    *,
    group_to_label: Dict[str, Dict[str, str]] | None,
    member_to_group: Dict[str, str] | None,
):
    if member_to_group and lhs in member_to_group and str(val) == "1":
        g = member_to_group[lhs]
        label = group_to_label.get(g, {}).get(lhs, lhs)
        return {"properties": {g: {"const": label}}}
    # default checkbox atom:
    return {"properties": {lhs: {"const": val}}}


def _wrap_condition_schema(schema: dict) -> dict:
    # JSONForms expects a condition object; when using root-level schema, scope = "#"
    return {"scope": "#", "schema": schema}


# update your AST → schema function to pass the maps
def _ast_to_schema(node, *, group_to_label=None, member_to_group=None):
    if node is None:
        return None
    kind = node[0]
    if kind == "ATOM":
        lhs, val = node[1]
        return _atom_schema(
            lhs, val, group_to_label=group_to_label, member_to_group=member_to_group
        )
    if kind == "NOT":
        child = _ast_to_schema(
            node[1], group_to_label=group_to_label, member_to_group=member_to_group
        )
        return {"not": child} if child else None
    if kind == "AND":
        subs = [
            _ast_to_schema(
                n, group_to_label=group_to_label, member_to_group=member_to_group
            )
            for n in node[1]
        ]
        subs = [s for s in subs if s]
        return {"allOf": subs} if subs else None
    if kind == "OR":
        # When ORing atoms from the same group, coalesce into enum
        subs = []
        enums_by_group: Dict[str, Set[str]] = {}
        for n in node[1]:
            s = _ast_to_schema(
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


# ----------------- Build parent map & owner resolution -----------------
def _build_parent_map(root: ET.Element) -> Dict[ET.Element, Optional[ET.Element]]:
    parent_map: Dict[ET.Element, Optional[ET.Element]] = {root: None}
    for parent in root.iter():
        for child in parent:
            parent_map[child] = parent
    return parent_map


def _nearest_event_ancestor(
    el: ET.Element, parent_map: Dict[ET.Element, Optional[ET.Element]]
) -> Optional[ET.Element]:
    cur = el
    while cur is not None:
        if _localname(cur.tag).lower() == "event":
            return cur
        cur = parent_map.get(cur)
    return None


def _iter_all_scripts_with_owner(root: ET.Element):
    """
    Yield (script_text, owner_name) for every <script>.
    Owner/driver is the parent of the nearest <event> ancestor.
    Fallback: nearest interesting ancestor if no <event> exists.
    """
    parent_map = _build_parent_map(root)

    def _nearest_interesting_ancestor(el: ET.Element) -> Optional[ET.Element]:
        cur = el
        while cur is not None:
            if _localname(cur.tag) in _INTERESTING_NODE_NAMES:
                return cur
            cur = parent_map.get(cur)
        return None

    for el in root.iter():
        if _localname(el.tag).lower() != "script":
            continue
        txt = (el.text or "").strip()
        if not txt:
            continue

        ev = _nearest_event_ancestor(el, parent_map)
        owner_el = (
            parent_map.get(ev) if ev is not None else _nearest_interesting_ancestor(el)
        )
        owner_name = _node_name(owner_el)

        yield txt, owner_name


# ----------------- JS parsing (presence only) -----------------
_JS_COMMENT_SLASHSLASH = re.compile(r"//[^\n\r]*")
_JS_COMMENT_BLOCK = re.compile(r"/\*.*?\*/", re.DOTALL)
_IF_ELSE_RE = re.compile(
    r"if\s*\((?P<cond>.*?)\)\s*\{(?P<if_body>.*?)\}\s*else\s*\{(?P<else_body>.*?)\}",
    re.DOTALL,
)
_PRESENCE_SET_RE = re.compile(
    r"""(?P<name>[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*\.presence\s*=\s*["'](?P<vis>visible|hidden)["']\s*;""",
    re.IGNORECASE,
)


def _strip_js_comments(js: str) -> str:
    js = _JS_COMMENT_BLOCK.sub("", js)
    js = _JS_COMMENT_SLASHSLASH.sub("", js)
    return js


def _presence_to_effect(vis: str) -> str:
    return "SHOW" if vis.lower() == "visible" else "HIDE"


def _add_presence_rules_from_body(
    body: str,
    cond_value: str,
    driver: Optional[str],
    rules_map: Dict[str, ElementRules],
):
    for pm in _PRESENCE_SET_RE.finditer(body):
        target = pm.group("name")
        vis = pm.group("vis")
        effect = _presence_to_effect(vis)
        if target not in rules_map:
            rules_map[target] = ElementRules(target)
        rules_map[target].add_rule(
            Rule(
                effect=effect, target=target, condition_value=cond_value, driver=driver
            )
        )


def _collect_rules_from_script(
    js: str, driver: Optional[str], rules_map: Dict[str, ElementRules]
):
    js_clean = _strip_js_comments(js)
    working = js_clean

    for m in _IF_ELSE_RE.finditer(js_clean):
        cond = m.group("cond").strip()
        if_body = m.group("if_body")
        else_body = m.group("else_body")
        _add_presence_rules_from_body(if_body, cond, driver, rules_map)
        _add_presence_rules_from_body(else_body, f"NOT({cond})", driver, rules_map)
        # remove this matched block from working so we can scan for unconditional presence
        start, end = m.span()
        working = working[:start] + " " * (end - start) + working[end:]

    # unconditional presence (outside any if/else)


#    _add_presence_rules_from_body(working, "ALWAYS", driver, rules_map)


def parse_all_scripts_to_element_rules(
    xdp_fragment: str,
) -> Tuple[ET.Element, Dict[str, ElementRules]]:
    """
    Returns (root, rules_map) for presence-only rules gathered from all scripts.
    """
    try:
        root = ET.fromstring(xdp_fragment)
    except ET.ParseError:
        wrapped = f"<root>{xdp_fragment}</root>"
        root = ET.fromstring(wrapped)

    rules_map: Dict[str, ElementRules] = {}
    for script_txt, owner in _iter_all_scripts_with_owner(root):
        _collect_rules_from_script(script_txt, owner, rules_map)

    return root, rules_map


# ----------------- Default presence index -----------------
def build_presence_index(root: ET.Element) -> Dict[str, str]:
    """
    Returns: name -> 'visible' | 'hidden' (defaults to 'visible' if absent).
    Treats XFA presence values 'hidden', 'invisible', 'inactive' as hidden.
    """
    idx: Dict[str, str] = {}
    for el in root.iter():
        lname = _localname(el.tag)
        if lname in _INTERESTING_NODE_NAMES:
            name = el.attrib.get("name") or el.attrib.get("id") or lname
            pres = (el.attrib.get("presence") or "visible").lower()
            hiddenish = {"hidden", "invisible", "inactive"}
            idx[name] = "hidden" if pres in hiddenish else "visible"
    return idx


# ----------------- Normalization (uses helpers explicitly) -----------------
NOT_RE = re.compile(r"^\s*NOT\((.*)\)\s*$")


def _split_not(cond: str) -> Tuple[str, bool]:
    m = NOT_RE.match(cond or "")
    if m:
        return m.group(1).strip(), True
    return (cond or "").strip(), False


def _same_base_condition(a: str, b: str) -> bool:
    return _split_not(a)[0] == _split_not(b)[0]


def _is_complement(a: str, b: str) -> bool:
    base_a, na = _split_not(a)
    base_b, nb = _split_not(b)
    return base_a == base_b and (na ^ nb)


def normalize_rules(rules_map: Dict[str, ElementRules], get_default_presence) -> None:
    """
    Normalize per (target, driver, base_condition):
      - EFFECT cond + EFFECT NOT(cond)   -> EFFECT ALWAYS
      - SHOW cond + HIDE NOT(cond)       -> keep only non-default branch
      - HIDE cond + SHOW NOT(cond)       -> keep only non-default branch
      - Dedup remaining rules
    get_default_presence(name) must return 'visible' | 'hidden' (default to 'visible' if unknown).
    """
    for target, er in rules_map.items():
        default_presence = (get_default_presence(target) or "visible").lower()

        # bucket by (driver, base_condition)
        buckets: Dict[Tuple[Optional[str], str], List[Rule]] = {}
        for r in er.rules:
            base, _ = _split_not(r.condition_value)
            key = (r.driver, base)
            buckets.setdefault(key, []).append(r)

        new_rules: List[Rule] = []

        for (driver, base), rules in buckets.items():
            show_rules = [r for r in rules if r.effect == "SHOW"]
            hide_rules = [r for r in rules if r.effect == "HIDE"]

            # Helper: do we have a complement pair within a list?
            def _has_unconditional(eff_rules: List[Rule]) -> bool:
                for i in range(len(eff_rules)):
                    for j in range(i + 1, len(eff_rules)):
                        if _is_complement(
                            eff_rules[i].condition_value, eff_rules[j].condition_value
                        ):
                            return True
                return False

            # 1) EFFECT cond + EFFECT NOT(cond)  -> EFFECT ALWAYS
            if _has_unconditional(hide_rules) and not show_rules:
                new_rules.append(
                    Rule(
                        effect="HIDE",
                        target=target,
                        condition_value="ALWAYS",
                        driver=driver,
                    )
                )
                continue
            if _has_unconditional(show_rules) and not hide_rules:
                new_rules.append(
                    Rule(
                        effect="SHOW",
                        target=target,
                        condition_value="ALWAYS",
                        driver=driver,
                    )
                )
                continue

            # 2) Clean toggle compression, keep only the non-default branch
            kept = False
            for ra in show_rules:
                for rb in hide_rules:
                    if not _is_complement(ra.condition_value, rb.condition_value):
                        continue
                    base_ra, na = _split_not(ra.condition_value)
                    base_rb, nb = _split_not(rb.condition_value)

                    # SHOW cond + HIDE NOT(cond)
                    if not na and nb:
                        if default_presence == "visible":
                            new_rules.append(
                                Rule(
                                    effect="SHOW",
                                    target=target,
                                    condition_value=base_ra,
                                    driver=driver,
                                )
                            )
                        else:  # default hidden
                            new_rules.append(
                                Rule(
                                    effect="HIDE",
                                    target=target,
                                    condition_value=f"NOT({base_ra})",
                                    driver=driver,
                                )
                            )
                        kept = True
                        break

                    # HIDE cond + SHOW NOT(cond)
                    if not nb and na:
                        if default_presence == "visible":
                            new_rules.append(
                                Rule(
                                    effect="HIDE",
                                    target=target,
                                    condition_value=base_rb,
                                    driver=driver,
                                )
                            )
                        else:  # default hidden
                            new_rules.append(
                                Rule(
                                    effect="SHOW",
                                    target=target,
                                    condition_value=f"NOT({base_rb})",
                                    driver=driver,
                                )
                            )
                        kept = True
                        break
                if kept:
                    break

            if kept:
                continue

            # 3) Fallback: keep unique remaining (effect, condition_value)
            seen = set()
            for r in rules:
                k = (r.effect, r.condition_value)
                if k not in seen:
                    seen.add(k)
                    new_rules.append(r)

        er.rules = new_rules


def apply_unconditional_to_defaults(
    rules_map: Dict[str, ElementRules],
    presence_index: Dict[str, str],
) -> None:
    """
    For each target, if we see an unconditional ALWAYS rule:
      - HIDE ALWAYS  -> baseline 'hidden'
      - SHOW ALWAYS  -> baseline 'visible'
    If both appear, last one wins (source order).
    ALWAYS rules are removed from the target's rule list afterward.
    """
    for target, er in rules_map.items():
        # detect unconditionals in source order
        new_rules: List[Rule] = []
        baseline_override: Optional[str] = None

        for r in er.rules:
            if r.condition_value == "ALWAYS":
                if r.effect == "HIDE":
                    baseline_override = "hidden"
                elif r.effect == "SHOW":
                    baseline_override = "visible"
                # don't keep ALWAYS rules
                continue
            new_rules.append(r)

        if baseline_override:
            presence_index[target] = baseline_override

        er.rules = new_rules


# ----------------- JSONForms emission -----------------
# Old:
# THIS_EQ_RE = re.compile(r'^\s*this\.rawValue\s*==\s*(")?(?P<val>[^"]+)\1\s*$')

# New: allows `this` or another identifier, optional quotes, optional semicolon, optional extra parens
COND_EQ_RE = re.compile(
    r"""^\s*
        \(*                                   # optional opening parens
        (?P<lhs>(?:this|[A-Za-z_]\w*))        # `this` or a simple identifier (e.g., chkAdditional)
        \s*\.\s*rawValue\s*
        (?:==|===)\s*                         # == or ===
        (?P<q>["'])?                          # optional opening quote
        (?P<val>[^"'\s][^"']*)                # value (not starting with quote; keep loose)
        (?P=q)?                               # optional matching closing quote
        \)*\s*                                # optional closing parens
        ;?\s*$                                # optional semicolon then end
    """,
    re.VERBOSE,
)


def _to_jsonforms_condition(
    cond_str: str, driver: Optional[str], name_to_pointer
) -> Optional[dict]:
    if cond_str == "ALWAYS":
        return None

    # unwrap NOT(...)
    base, is_neg = _split_not(cond_str)

    m = COND_EQ_RE.match(base)
    if not m:
        # Optional: log so you can find odd cases, but don't spam production
        # print("NO MATCH for condition:", cond_str)
        return None

    lhs = m.group("lhs")  # 'this' or a field name like 'chkAdditional'
    raw = (m.group("val") or "").strip()

    # best-effort cast
    try:
        val = int(raw)
    except ValueError:
        try:
            val = float(raw)
        except ValueError:
            val = raw

    # If LHS is an explicit field, prefer it as the driver
    effective_driver = driver
    if lhs != "this":
        effective_driver = lhs

    if not effective_driver:
        return None

    scope = name_to_pointer(effective_driver)
    if not scope:
        return None

    base_cond = {"scope": scope, "schema": {"const": val}}
    return {"not": base_cond} if is_neg else base_cond


def _to_jsonforms_condition_rich(
    cond_str: str, driver: Optional[str], *, group_to_label=None, member_to_group=None
) -> Optional[dict]:
    if not cond_str or cond_str == "ALWAYS":
        return None
    s = re.sub(r"\bthis\b", driver, cond_str) if driver else cond_str
    ast = _parse_bool_expr(s)
    schema = _ast_to_schema(
        ast, group_to_label=group_to_label, member_to_group=member_to_group
    )
    if not schema:
        return None
    return {"scope": "#", "schema": schema}


def _merge_conditions_anyof(
    root: ET.ElementTree,
    per_rules: List["Rule"],
    name_to_pointer,
    driver_fallback: Optional[str],
) -> Optional[dict]:
    if not per_rules:
        return None

    group_to_label, member_to_group = build_choice_groups(root)

    # If there's only one, prefer the rich emitter
    if len(per_rules) == 1:
        r = per_rules[0]
        cond = _to_jsonforms_condition_rich(
            r.condition_value,
            r.driver or driver_fallback,
            group_to_label=group_to_label,
            member_to_group=member_to_group,
        )
        if cond:
            return cond
        # Fallback: simple equality -> convert to atom schema at root
        base = _to_jsonforms_condition(r.condition_value, r.driver, name_to_pointer)
        if not base:
            return None
        scope = base.get("scope") or ""
        # extract property name for atom
        if "/properties/" in scope:
            prop = scope.split("/properties/")[-1].split("/")[0]
            atom = {"properties": {prop: base["schema"]}}
            return _wrap_condition_schema(atom)
        return None

    # Many rules → OR them with anyOf at the root
    subs: List[dict] = []
    for rr in per_rules:
        rich = _to_jsonforms_condition_rich(
            rr.condition_value,
            rr.driver or driver_fallback,
            group_to_label=group_to_label,
            member_to_group=member_to_group,
        )
        if rich and "schema" in rich:
            subs.append(rich["schema"])
            continue

        # Fallback simple -> atom schema
        base = _to_jsonforms_condition(rr.condition_value, rr.driver, name_to_pointer)
        if not base:
            continue
        scope = base.get("scope") or ""
        if "/properties/" in scope:
            prop = scope.split("/properties/")[-1].split("/")[0]
            subs.append({"properties": {prop: base["schema"]}})

    if not subs:
        return None
    return _wrap_condition_schema({"anyOf": subs})


def to_jsonforms_rules(
    root: ET.Element,
    rules_map: Dict[str, "ElementRules"],
    name_to_pointer,
    get_default_presence=lambda name: "visible",
) -> Dict[str, dict]:
    """
    Emit one rule object per target, using root-level schema conditions with scope "#".
    Drop rules that restate the baseline presence.
    """
    out: Dict[str, dict] = {}

    for target, er in rules_map.items():
        baseline = (get_default_presence(target) or "visible").lower()

        # Filter out rules that restate baseline (SHOW when default visible; HIDE when default hidden)
        filtered = [
            r
            for r in er.rules
            if not (
                (baseline == "visible" and r.effect == "SHOW")
                or (baseline == "hidden" and r.effect == "HIDE")
            )
        ]
        if not filtered:
            continue

        # Group by effect; after your normalize step we should usually have just one effect
        by_effect: Dict[str, List["Rule"]] = {}
        for r in filtered:
            by_effect.setdefault(r.effect, []).append(r)

        # Prefer a single effect. If both exist (rare), pick the non-baseline effect.
        effect = None
        rules_for_effect: List["Rule"] = []
        if "SHOW" in by_effect and "HIDE" not in by_effect:
            effect, rules_for_effect = "SHOW", by_effect["SHOW"]
        elif "HIDE" in by_effect and "SHOW" not in by_effect:
            effect, rules_for_effect = "HIDE", by_effect["HIDE"]
        else:
            # both present; choose the one that differs from baseline
            if baseline == "visible" and "HIDE" in by_effect:
                effect, rules_for_effect = "HIDE", by_effect["HIDE"]
            elif baseline == "hidden" and "SHOW" in by_effect:
                effect, rules_for_effect = "SHOW", by_effect["SHOW"]
            else:
                # fallback: pick the one with more rules
                picks = sorted(
                    by_effect.items(), key=lambda kv: len(kv[1]), reverse=True
                )
                effect, rules_for_effect = picks[0]

        cond = _merge_conditions_anyof(
            root, rules_for_effect, name_to_pointer, driver_fallback=None
        )
        if not cond:
            continue

        # FINAL: single rule object
        out[target] = {
            "effect": effect,
            "condition": cond,  # => {"scope":"#","schema":{...}}
        }

    return out


# --- assume: Rule, ElementRules, and all helpers from earlier are already defined ---
# (build_presence_index, _iter_all_scripts_with_owner, _collect_rules_from_script,
#  normalize_rules, to_jsonforms_rules, etc.)


def parse_all_scripts_to_element_rules_from_root(
    root: ET.Element,
) -> Dict[str, ElementRules]:
    """
    Collect presence-only rules from every <script> in an existing ElementTree root.
    Returns: { target_name: ElementRules }
    """
    rules_map: Dict[str, ElementRules] = {}
    for script_txt, owner in _iter_all_scripts_with_owner(root):
        _collect_rules_from_script(script_txt, owner, rules_map)
    return rules_map


def process_xdp_root_for_jsonforms_rules(
    root: ET.Element, name_to_pointer
) -> Dict[str, List[dict]]:
    rules_map = parse_all_scripts_to_element_rules_from_root(root)
    presence_index = build_presence_index(root)

    # fold unconditional script presence into baseline, and drop those ALWAYS rules
    apply_unconditional_to_defaults(rules_map, presence_index)

    get_default_presence = lambda name: presence_index.get(name, "visible")
    normalize_rules(rules_map, get_default_presence)
    return to_jsonforms_rules(root, rules_map, name_to_pointer, get_default_presence)


# # (Optional) Backward-compatible wrapper if you still pass strings sometimes.
# def process_xdp_for_jsonforms_rules(
#     xdp_fragment: str,
#     name_to_pointer,
# ) -> Dict[str, List[dict]]:
#     """
#     Legacy wrapper: accepts a string/fragment, parses it to an ElementTree root,
#     then delegates to process_xdp_root_for_jsonforms_rules.
#     """
#     try:
#         root = ET.fromstring(xdp_fragment)
#     except ET.ParseError:
#         root = ET.fromstring(f"<root>{xdp_fragment}</root>")
#     return process_xdp_root_for_jsonforms_rules(root, name_to_pointer)
