import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple
from rule_generator.radio_rules import RadioRules
from rule_generator.regular_expressions import COND_EQ_ANY_LHS_RE
from rule_generator.parse_selectors import ParseSelectors
from rule_generator.element_rules import ElementRules, Rule
from xdp_parser.xdp_utils import node_name, strip_not, tag_name


class RulesParser:
    def __init__(self, root: ET.Element):
        self.root = root
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

    # def to_jsonforms_rules(
    #     self,
    #     rules_map: Dict[str, "ElementRules"],
    #     get_default_presence,
    #     debug: bool = False,
    # ) -> Dict[str, dict]:
    #     """
    #     Emits ONE JSONForms rule object per target:
    #     - Try radio-driven collapse first (based on original rules)
    #     - Else drop baseline-restating rules, group by effect, merge via anyOf
    #     - Finally, simplify radio anyOfs to NOT(const) or SHOW const when domain-1
    #     Returns: { targetName: { "effect": "...", "condition": {"scope":"#","schema":{...}} } }
    #     """
    #     out: Dict[str, dict] = {}

    #     # Build radio domains for simplification
    #     group_domain = {
    #         g: list(labels.values()) for g, labels in self.group_to_button_map.items()
    #     }

    #     for target, er in rules_map.items():
    #         original_rules = er.rules[:]  # copy BEFORE filtering
    #         baseline = (get_default_presence(target) or "visible").lower()

    #         # 1) Try radio collapse (uses SHOW member==1 from original rules)
    #         collapsed = _radio_collapse_for_target_full(
    #             target,
    #             original_rules,
    #             group_to_label=self.group_to_button_map,
    #             member_to_group=self.button_to_group_map,
    #             get_default_presence=get_default_presence,
    #         )
    #         if collapsed:
    #             if debug:
    #                 print(
    #                     f"[radio-collapse] {target}: -> {collapsed['effect']} on radio group"
    #                 )
    #             # optional readability simplification (usually noop here)
    #             collapsed = self._simplify_radio_rule(
    #                 collapsed,
    #                 group_domain=group_domain,
    #                 prefer_positive=True,
    #                 baseline=baseline,
    #             )
    #             out[target] = collapsed
    #             continue

    #         # 2) Filter out rules that restate the baseline
    #         filtered: List["Rule"] = [
    #             r
    #             for r in er.rules
    #             if not (
    #                 (baseline == "visible" and r.effect == "SHOW")
    #                 or (baseline == "hidden" and r.effect == "HIDE")
    #             )
    #         ]
    #         if not filtered:
    #             continue

    #         # 3) Group by effect
    #         by_effect: Dict[str, List["Rule"]] = {}
    #         for r in filtered:
    #             by_effect.setdefault(r.effect, []).append(r)

    #         # 4) Choose the effect: prefer the one that differs from baseline
    #         effect: Optional[str] = None
    #         rules_for_effect: List["Rule"] = []
    #         if "SHOW" in by_effect and "HIDE" not in by_effect:
    #             effect, rules_for_effect = "SHOW", by_effect["SHOW"]
    #         elif "HIDE" in by_effect and "SHOW" not in by_effect:
    #             effect, rules_for_effect = "HIDE", by_effect["HIDE"]
    #         else:
    #             # both exist -> pick non-baseline if possible
    #             if baseline == "visible" and "HIDE" in by_effect:
    #                 effect, rules_for_effect = "HIDE", by_effect["HIDE"]
    #             elif baseline == "hidden" and "SHOW" in by_effect:
    #                 effect, rules_for_effect = "SHOW", by_effect["SHOW"]
    #             else:
    #                 # fallback: whichever has more rules
    #                 effect, rules_for_effect = max(
    #                     by_effect.items(), key=lambda kv: len(kv[1])
    #                 )

    #         # 5) Build merged condition(s)
    #         cond = self._build_anyof_from_rules(
    #             rules_for_effect,
    #             group_to_label=self.group_to_button_map,
    #             member_to_group=self.button_to_group_map,
    #         )
    #         if not cond:
    #             if debug:
    #                 print(
    #                     f"[emit-skip] {target}: could not build condition for effect {effect}"
    #                 )
    #             continue

    #         rule_obj = {"effect": effect, "condition": cond}

    #         # 6) Readability simplification for radio domains (others -> NOT(mine) / SHOW mine)
    #         rule_obj = self._simplify_radio_rule(
    #             rule_obj,
    #             group_domain=group_domain,
    #             prefer_positive=True,
    #             baseline=baseline,
    #         )

    #         out[target] = rule_obj

    #     return out

    # def _simplify_radio_rule(
    #     self,
    #     rule: dict,
    #     group_domain: Dict[str, List[str]],
    #     prefer_positive: bool = True,
    #     baseline: Optional[str] = None,
    # ) -> dict:
    #     """
    #     If rule is an anyOf over Group == values and they cover domain-1, flip to the missing value.
    #     """
    #     cond = rule.get("condition") or {}
    #     schema = cond.get("schema") or {}
    #     any_of = schema.get("anyOf")
    #     if not isinstance(any_of, list) or not any_of:
    #         return rule

    #     group = None
    #     values = []
    #     for atom in any_of:
    #         props = atom.get("properties") if isinstance(atom, dict) else None
    #         if not props or len(props) != 1:
    #             return rule
    #         (g, s) = next(iter(props.items()))
    #         if "const" not in s:
    #             return rule
    #         if group is None:
    #             group = g
    #         elif group != g:
    #             return rule
    #         values.append(s["const"])

    #     domain = group_domain.get(group)
    #     if not domain:
    #         return rule

    #     domain_set, vals_set = set(domain), set(values)
    #     if len(vals_set) != len(domain_set) - 1:
    #         return rule

    #     missing = list(domain_set - vals_set)
    #     if len(missing) != 1:
    #         return rule
    #     the_only = missing[0]

    #     atom = {"properties": {group: {"const": the_only}}}
    #     if prefer_positive and baseline and baseline.lower() == "hidden":
    #         return {"effect": "SHOW", "condition": {"scope": "#", "schema": atom}}

    #     return {
    #         "effect": rule.get("effect"),
    #         "condition": {"scope": "#", "schema": {"not": atom}},
    #     }

    # def _build_anyof_from_rules(
    #     self,
    #     rules: List["Rule"],
    #     group_to_label: Dict[str, Dict[str, str]],
    #     member_to_group: Dict[str, str],
    # ) -> Optional[dict]:
    #     """
    #     Merge multiple rule conditions into one {scope:"#", schema:{anyOf:[...]}}.
    #     Uses rich emitter per rule; skips any rule it can’t translate.
    #     """
    #     subs: List[dict] = []
    #     for r in rules:
    #         rich = self._to_jsonforms_condition_rich(
    #             r.condition_value,
    #             r.driver,
    #             group_to_label=group_to_label,
    #             member_to_group=member_to_group,
    #         )
    #         if not rich or "schema" not in rich:
    #             continue
    #         subs.append(rich["schema"])
    #     if not subs:
    #         return None
    #     if len(subs) == 1:
    #         # single condition — return as-is but ensure scope "#"
    #         return {"scope": "#", "schema": subs[0]}
    #     return {"scope": "#", "schema": {"anyOf": subs}}

    # def _to_jsonforms_condition_rich(
    #     self,
    #     cond_str: str,
    #     driver: Optional[str],
    #     *,
    #     group_to_label: Dict[str, Dict[str, str]] = None,
    #     member_to_group: Dict[str, str] = None,
    # ) -> Optional[dict]:
    #     """
    #     Rich emitter that parses && / || / ! and rewrites radio-members (chkX == 1)
    #     to group-based atoms: { "properties": { Group: {"const": "Label"} } }.
    #     Returns {"scope":"#","schema":{...}} or None.
    #     """
    #     if not cond_str or cond_str == "ALWAYS":
    #         return None
    #     s = re.sub(r"\bthis\b", driver, cond_str) if driver else cond_str
    #     ast = _parse_bool_expr(s)
    #     schema = node_to_rule(
    #         ast, group_to_label=group_to_label, member_to_group=member_to_group
    #     )
    #     if not schema:
    #         return None
    #     return {"scope": "#", "schema": schema}

    # def _to_jsonforms_rules(
    #     self,
    #     rules_map: Dict[str, "ElementRules"],
    #     get_default_presence=lambda name: "visible",
    # ) -> Dict[str, dict]:
    #     """
    #     Emit one rule object per target, using root-level schema conditions with scope "#".
    #     Drop rules that restate the baseline presence.
    #     """
    #     out: Dict[str, dict] = {}

    #     for target, er in rules_map.items():
    #         baseline = (get_default_presence(target) or "visible").lower()

    #         # Filter out rules that restate baseline (SHOW when default visible; HIDE when default hidden)
    #         filtered = [
    #             r
    #             for r in er.rules
    #             if not (
    #                 (baseline == "visible" and r.effect == "SHOW")
    #                 or (baseline == "hidden" and r.effect == "HIDE")
    #             )
    #         ]
    #         if not filtered:
    #             continue

    #         collapsed = self._radio_collapse_for_target(
    #             target,
    #             filtered,
    #             get_default_presence=get_default_presence,
    #         )
    #         if collapsed:
    #             out[target] = collapsed
    #             continue

    #         # Group by effect; after your normalize step we should usually have just one effect
    #         by_effect: Dict[str, List["Rule"]] = {}
    #         for r in filtered:
    #             by_effect.setdefault(r.effect, []).append(r)

    #         # Prefer a single effect. If both exist (rare), pick the non-baseline effect.
    #         effect = None
    #         rules_for_effect: List["Rule"] = []
    #         if "SHOW" in by_effect and "HIDE" not in by_effect:
    #             effect, rules_for_effect = "SHOW", by_effect["SHOW"]
    #         elif "HIDE" in by_effect and "SHOW" not in by_effect:
    #             effect, rules_for_effect = "HIDE", by_effect["HIDE"]
    #         else:
    #             # both present; choose the one that differs from baseline
    #             if baseline == "visible" and "HIDE" in by_effect:
    #                 effect, rules_for_effect = "HIDE", by_effect["HIDE"]
    #             elif baseline == "hidden" and "SHOW" in by_effect:
    #                 effect, rules_for_effect = "SHOW", by_effect["SHOW"]
    #             else:
    #                 # fallback: pick the one with more rules
    #                 picks = sorted(
    #                     by_effect.items(), key=lambda kv: len(kv[1]), reverse=True
    #                 )
    #                 effect, rules_for_effect = picks[0]

    #         cond = self._merge_conditions_anyof(rules_for_effect, driver_fallback=None)
    #         if not cond:
    #             continue

    #         # FINAL: single rule object
    #         out[target] = {
    #             "effect": effect,
    #             "condition": cond,  # => {"scope":"#","schema":{...}}
    #         }

    #     return out

    def _find_all_scripts_and_owner(self):
        """
        Yield (script_text, owner_name) for every <script>.
        Owner/driver is the parent of the nearest <event> ancestor.
        Fallback: nearest interesting ancestor if no <event> exists.
        """
        parent_map = self._build_parent_map()

        def _nearest_interesting_ancestor(el: ET.Element) -> Optional[ET.Element]:
            cur = el
            while cur is not None:
                if tag_name(cur.tag) in _INTERESTING_NODE_NAMES:
                    return cur
                cur = parent_map.get(cur)
            return None

        for el in self.root.iter():
            if tag_name(el.tag).lower() != "script":
                continue
            txt = (el.text or "").strip()
            if not txt:
                continue

            ev = self._nearest_event_ancestor(el, parent_map)
            owner_el = (
                parent_map.get(ev)
                if ev is not None
                else _nearest_interesting_ancestor(el)
            )
            owner_name = node_name(owner_el)

            yield txt, owner_name

    def _build_parent_map(self) -> Dict[ET.Element, Optional[ET.Element]]:
        parent_map: Dict[ET.Element, Optional[ET.Element]] = {self.root: None}
        for parent in self.root.iter():
            for child in parent:
                parent_map[child] = parent
        return parent_map

    def _nearest_event_ancestor(
        self, el: ET.Element, parent_map: Dict[ET.Element, Optional[ET.Element]]
    ) -> Optional[ET.Element]:
        cur = el
        while cur is not None:
            if tag_name(cur.tag).lower() == "event":
                return cur
            cur = parent_map.get(cur)
        return None

    # def _radio_collapse_for_target(
    #     self,
    #     target: str,
    #     rules: list["Rule"],
    #     get_default_presence,
    # ) -> dict | None:
    #     """
    #     If this target's show/hide is driven by a mutually-exclusive group,
    #     collapse to a single rule using the group's enum value.

    #     Returns a JSONForms rule object {"effect": "...", "condition": {"scope":"#","schema":{...}}}
    #     or None if not applicable.
    #     """
    #     # Find any SHOW rule that references a member of a radio group
    #     chosen = None  # (group_name, label_value)
    #     for r in rules:
    #         # We only trust simple atoms for this detection; use the member driver
    #         # e.g., condition "chkEmergency.rawValue == 1"
    #         # We look up r.driver first (you already capture that), otherwise parse LHS from condition.
    #         driver = r.driver
    #         if not driver:
    #             # Fallback: extract lhs from "lhs.rawValue == 1"
    #             m = COND_EQ_ANY_LHS_RE.match(strip_not(r.condition_value)[0])
    #             driver = m.group("lhs") if m else None
    #         if not driver:
    #             continue

    #         if (
    #             driver in self.button_to_group_map
    #             and str(self._extract_const_value(r.condition_value)) == "1"
    #             and r.effect == "SHOW"
    #         ):
    #             g = self.button_to_group_map[driver]
    #             label = self.group_to_button_map.get(g, {}).get(driver)
    #             if label:
    #                 chosen = (g, label)
    #                 break

    #     if not chosen:
    #         return None  # not a radio-driven target

    #     group, label = chosen
    #     baseline = (get_default_presence(target) or "visible").lower()

    #     # Build a single condition on the GROUP, not the member
    #     schema_atom = {"properties": {group: {"const": label}}}
    #     condition = {"scope": "#", "schema": schema_atom}

    #     if baseline == "hidden":
    #         # Show exactly when the group's value equals ours
    #         return {"effect": "SHOW", "condition": condition}
    #     else:
    #         # Hide whenever the group's value is NOT ours
    #         return {
    #             "effect": "HIDE",
    #             "condition": {"scope": "#", "schema": {"not": schema_atom}},
    #         }

    # def _extract_const_value(self, cond_str: str):
    #     base, _is_neg = strip_not(cond_str)
    #     m = COND_EQ_ANY_LHS_RE.match(base)
    #     if not m:
    #         return None
    #     raw = (m.group("val") or "").strip()
    #     for caster in (int, float):
    #         try:
    #             return caster(raw)
    #         except Exception:
    #             pass
    #     return raw

    # def _merge_conditions_anyof(
    #     self,
    #     per_rules: List["Rule"],
    #     driver_fallback: Optional[str],
    # ) -> Optional[dict]:
    #     if not per_rules:
    #         return None

    #     # If there's only one, prefer the rich emitter
    #     if len(per_rules) == 1:
    #         r = per_rules[0]
    #         cond = to_multi_condition_rule(
    #             r.condition_value,
    #             r.driver or driver_fallback,
    #             self.group_to_button_map,
    #             self.button_to_group_map,
    #         )
    #         if cond:
    #             return cond
    #         # Fallback: simple equality -> convert to atom schema at root
    #         base = to_single_condition_rule(r.condition_value, r.driver)
    #         if not base:
    #             return None
    #         scope = base.get("scope") or ""
    #         # extract property name for atom
    #         if "/properties/" in scope:
    #             prop = scope.split("/properties/")[-1].split("/")[0]
    #             atom = {"properties": {prop: base["schema"]}}
    #             return _build_rule(atom)
    #         return None

    #     # Many rules → OR them with anyOf at the root
    #     subs: List[dict] = []
    #     for rr in per_rules:
    #         rich = to_multi_condition_rule(
    #             rr.condition_value,
    #             rr.driver or driver_fallback,
    #             self.group_to_button_map,
    #             self.button_to_group_map,
    #         )
    #         if rich and "schema" in rich:
    #             subs.append(rich["schema"])
    #             continue

    #         # Fallback simple -> atom schema
    #         base = to_single_condition_rule(rr.condition_value, rr.driver)
    #         if not base:
    #             continue
    #         scope = base.get("scope") or ""
    #         if "/properties/" in scope:
    #             prop = scope.split("/properties/")[-1].split("/")[0]
    #             subs.append({"properties": {prop: base["schema"]}})

    #     if not subs:
    #         return None
    #     return _build_rule({"anyOf": subs})


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
