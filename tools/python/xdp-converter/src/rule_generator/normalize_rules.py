import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple
from rule_generator.radio_rules import RadioRules
from rule_generator.regular_expressions import COND_EQ_ANY_LHS_RE
from rule_generator.parse_selectors import ParseSelectors
from rule_generator.element_rules import ElementRules, Rule
from xdp_parser.xdp_utils import node_name, strip_not, tag_name


class RulesParser:
    def __init__(self, root: ET.Element, parent_map: Dict[ET.Element, ET.Element]):
        self.root = root
        self.parent_map = parent_map
        parser = ParseSelectors(root)
        self.group_to_button_map, self.button_to_group_map = parser.build_choice_groups(
            root
        )

    def extract_rules(self) -> Dict[str, List[dict]]:
        rules_map = self._parse_all_scripts_to_element_rules_from_root()
        presence_index = self._build_presence_index()

        # fold unconditional script presence into baseline, and drop those ALWAYS rules
        self._apply_unconditional_to_defaults(rules_map, presence_index)

        get_default_presence = lambda name: presence_index.get(name, "visible")
        self._normalize_rules(rules_map, get_default_presence)
        rules_engine = RadioRules(
            self.group_to_button_map, self.button_to_group_map, get_default_presence
        )
        return rules_engine.to_jsonforms_rules(rules_map)

    def _build_presence_index(self) -> Dict[str, str]:
        """
        Returns: name -> 'visible' | 'hidden' (defaults to 'visible' if absent).
        Treats XFA presence values 'hidden', 'invisible', 'inactive' as hidden.
        """
        idx: Dict[str, str] = {}
        for el in self.root.iter():
            lname = tag_name(el.tag)
            if lname in _INTERESTING_NODE_NAMES:
                name = el.attrib.get("name") or el.attrib.get("id") or lname
                pres = (el.attrib.get("presence") or "visible").lower()
                hiddenish = {"hidden", "invisible", "inactive"}
                idx[name] = "hidden" if pres in hiddenish else "visible"
        return idx

    def _parse_all_scripts_to_element_rules_from_root(
        self,
    ) -> Dict[str, ElementRules]:
        """
        Collect presence-only rules from every <script> in an existing ElementTree root.
        Returns: { target_name: ElementRules }
        """
        rules_map: Dict[str, ElementRules] = {}
        for script_txt, owner in self._find_all_scripts_and_owner():
            _collect_rules_from_script(script_txt, owner, rules_map)
        return rules_map

    def _apply_unconditional_to_defaults(
        self,
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

    def _normalize_rules(
        self, rules_map: Dict[str, ElementRules], get_default_presence
    ) -> None:
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
                base, _ = strip_not(r.condition_value)
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
                                eff_rules[i].condition_value,
                                eff_rules[j].condition_value,
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
                        base_ra, na = strip_not(ra.condition_value)
                        base_rb, nb = strip_not(rb.condition_value)

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

    def _find_all_scripts_and_owner(self):
        """
        Yield (script_text, owner_name) for every <script>.
        Owner/driver is the parent of the nearest <event> ancestor.
        Fallback: nearest interesting ancestor if no <event> exists.
        """

        def _nearest_interesting_ancestor(el: ET.Element) -> Optional[ET.Element]:
            cur = el
            while cur is not None:
                if tag_name(cur.tag) in _INTERESTING_NODE_NAMES:
                    return cur
                cur = self.parent_map.get(cur)
            return None

        for el in self.root.iter():
            if tag_name(el.tag).lower() != "script":
                continue
            txt = (el.text or "").strip()
            if not txt:
                continue

            ev = self._nearest_event_ancestor(el, self.parent_map)
            owner_el = (
                self.parent_map.get(ev)
                if ev is not None
                else _nearest_interesting_ancestor(el)
            )
            owner_name = node_name(owner_el)

            yield txt, owner_name

    def _nearest_event_ancestor(
        self, el: ET.Element, parent_map: Dict[ET.Element, Optional[ET.Element]]
    ) -> Optional[ET.Element]:
        cur = el
        while cur is not None:
            if tag_name(cur.tag).lower() == "event":
                return cur
            cur = parent_map.get(cur)
        return None


# presence mapping used later
_INTERESTING_NODE_NAMES = {
    "field",
    "subform",
    "exclGroup",
    "draw",
    "area",
    "subformSet",
}


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


def _is_complement(a: str, b: str) -> bool:
    base_a, na = strip_not(a)
    base_b, nb = strip_not(b)
    return base_a == base_b and (na ^ nb)


def _build_rule(schema: dict) -> dict:
    return {"scope": "#", "schema": schema}


def _extract_atom_lhs_const(cond_str: str):
    base, _ = strip_not(cond_str)
    m = COND_EQ_ANY_LHS_RE.match(base)
    if not m:
        return None, None
    lhs = m.group("lhs")
    raw = (m.group("val") or "").strip()
    for caster in (int, float):
        try:
            return lhs, caster(raw)
        except Exception:
            pass
    return lhs, raw


def _infer_target_radio_value_from_rules(
    rules: list["Rule"],
    *,
    group_to_label: dict[str, dict[str, str]],
    member_to_group: dict[str, str],
) -> tuple[str, str] | None:
    """
    Try to determine (group_name, label_value) that this target corresponds to.
    Strategy:
      A) Prefer any SHOW rule like (member == 1)
      B) Otherwise, if we see a merged HIDE-anyOf over the group that covers domain-1,
         infer the missing value.
    Returns None if we can’t decide.
    """
    # A) Any SHOW (member == 1) -> direct mapping
    for r in rules:
        if r.effect != "SHOW":
            continue
        lhs, const = _extract_atom_lhs_const(r.condition_value)
        driver = r.driver or lhs
        if not driver:
            continue
        if driver in member_to_group and str(const) == "1":
            g = member_to_group[driver]
            label = group_to_label.get(g, {}).get(driver)
            if label:
                return g, label

    # B) Look for an already-merged HIDE anyOf over the group (we’ll get it later,
    #    but sometimes you already have a merged rule in rules_map)
    #    If your pipeline never stores merged conditions back in rules_map, skip this and
    #    infer in the emitter from the merged anyOf (see _simplify step below).
    return None


def _radio_collapse_for_target_full(
    target: str,
    original_rules: list["Rule"],
    *,
    group_to_label: dict[str, dict[str, str]],
    member_to_group: dict[str, str],
    get_default_presence,
) -> dict | None:
    """
    Decide a single canonical rule for radio-driven targets.
    Returns JSONForms rule or None if not radio-driven.
    """
    # Try direct SHOW detection first
    picked = _infer_target_radio_value_from_rules(
        original_rules,
        group_to_label=group_to_label,
        member_to_group=member_to_group,
    )
    if not picked:
        return None  # we’ll still have a later simplification from anyOf if needed

    group, label = picked
    baseline = (get_default_presence(target) or "visible").lower()
    atom = {"properties": {group: {"const": label}}}

    if baseline == "hidden":
        return {"effect": "SHOW", "condition": {"scope": "#", "schema": atom}}
    else:
        return {"effect": "HIDE", "condition": {"scope": "#", "schema": {"not": atom}}}
