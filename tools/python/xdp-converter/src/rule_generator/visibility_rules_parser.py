import re
import xml.etree.ElementTree as ET
import json
from typing import Dict, List, Optional, Tuple
from rule_generator.presence_event_scanner import PresenceEventScanner
from rule_generator.regular_expressions import COND_EQ_ANY_LHS_RE
from rule_generator.parse_selectors import ParseSelectors
from rule_generator.element_rules import ElementRules, Rule
from xdp_parser.xdp_utils import node_name, strip_not, tag_name


class VisibilityRulesParser:
    def __init__(self, root: ET.Element, parent_map: Dict[ET.Element, ET.Element]):
        self.root = root
        self.parent_map = parent_map
        parser = ParseSelectors(root)
        self.target_to_trigger_map, self.trigger_to_target_map = (
            parser.build_choice_groups(root)
        )
        self.presence_event_scanner = PresenceEventScanner(root)
        self.presence_event_rules = self.presence_event_scanner.scan()

    def extract_rules(self) -> Dict[str, List[dict]]:
        rules_map = self._parse_all_scripts_to_element_rules_from_root()
        presence_index = self._build_presence_index()

        # fold unconditional script presence into baseline, and drop those ALWAYS rules
        self._apply_unconditional_to_defaults(rules_map, presence_index)

        get_default_presence = lambda name: presence_index.get(name, "visible")
        self._normalize_rules(rules_map, get_default_presence)

        # 2. Merge in newly discovered presence rules (new method)
        for target, er in self.presence_event_rules.items():
            # Skip unqualified duplicates if a scoped version already exists
            if "." not in target and any(k.endswith(f".{target}") for k in rules_map):
                continue

            if target not in rules_map:
                rules_map[target] = er
            else:
                for rule in er.rules:
                    rules_map[target].add_rule(rule)

        # Combine both
        engine = VisibilityRulesEngine(
            self.target_to_trigger_map,
            self.trigger_to_target_map,
            get_default_presence,
        )

        final_rules = engine.to_jsonforms_rules(rules_map)
        return final_rules

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
            self._collect_rules_from_script(script_txt, owner, rules_map)
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
        Yield (script_text, owner_name) for every <script> block.

        - Walks up the tree to find the nearest <event> and its parent (usually a field or subform)
        - Ignores 'event__...' pseudo-names, returning the actual field/subform name instead
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

            # 🧹 Clean up event name pseudo-fields like "event__exit"
            if owner_name and owner_name.startswith("event__"):
                # climb one level higher to get the real field/subform
                owner_name = node_name(self.parent_map.get(owner_el))

            # Defensive fallback
            if not owner_name:
                owner_name = "unknown_owner"

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

    def _add_presence_rules_from_body(
        self,
        body: str,
        cond_value: str,
        driver: Optional[str],
        rules_map: Dict[str, ElementRules],
        parent_map: Optional[Dict[ET.Element, ET.Element]] = None,
        root: Optional[ET.Element] = None,
    ):
        """
        Parse a JavaScript block for .presence assignments and add them as rules.
        Uses driver's subtree to qualify relative names.
        """
        #        print(f"SCAN BODY for driver={driver!r}")

        for pm in _PRESENCE_SET_RE.finditer(body):
            target = pm.group("name")  # e.g. "Alternate" or "Section4.Alternate"
            vis = pm.group("vis")
            effect = _presence_to_effect(vis)

            # --- Resolve node within driver's context only ---
            target_node = self._find_node_by_name(
                target.split(".")[-1], context_driver=driver
            )

            # Derive full path
            full_path = target
            if target_node is not None and parent_map is not None:
                parts = []
                node = target_node
                while node is not None:
                    nm = node.attrib.get("name")
                    if nm:
                        parts.insert(0, nm)
                    node = parent_map.get(node)
                full_path = ".".join(parts)

            # --- Fallback: prefix with driver's context path if still unqualified ---
            if full_path == target and driver and parent_map is not None:
                driver_node = self._find_node_by_name(driver)
                if driver_node is not None:
                    ctx_parts = []
                    node = parent_map.get(driver_node)
                    while node is not None:
                        nm = node.attrib.get("name")
                        if nm:
                            ctx_parts.insert(0, nm)
                        node = parent_map.get(node)
                    if ctx_parts:
                        full_path = f"{'.'.join(ctx_parts)}.{target}"

            # --- Skip unresolved or obviously unqualified targets ---
            if target_node is None and "." not in full_path:
                # print(f"⚠️  Skipping unresolved target: {target} (driver={driver})")
                continue

            # --- Store rule ---
            er = rules_map.setdefault(full_path, ElementRules(full_path))
            er.add_rule(
                Rule(
                    effect=effect,
                    target=full_path,
                    condition_value=cond_value,
                    driver=driver,
                )
            )

    #            print(f"  Added rule for: {full_path} ({effect})")

    def _collect_rules_from_script(
        self, js: str, driver: Optional[str], rules_map: Dict[str, ElementRules]
    ):
        js_clean = _strip_js_comments(js)
        working = js_clean

        for m in _IF_ELSE_RE.finditer(js_clean):
            cond = m.group("cond").strip()
            if_body = m.group("if_body")
            else_body = m.group("else_body")
            self._add_presence_rules_from_body(
                if_body, cond, driver, rules_map, self.parent_map, self.root
            )
            self._add_presence_rules_from_body(
                else_body, f"NOT({cond})", driver, rules_map, self.parent_map, self.root
            )
            # remove this matched block from working so we can scan for unconditional presence
            start, end = m.span()
            working = working[:start] + " " * (end - start) + working[end:]

    def _find_node_by_name(
        self, name: str, *, context_driver: Optional[str] = None
    ) -> Optional[ET.Element]:
        """
        Find an element by its name attribute.
        If `context_driver` is provided, search is limited to the driver's subtree first,
        then falls back to global search.
        """
        # First, locate the driver's element (if given)
        search_root = self.root
        if context_driver:
            for el in self.root.iter():
                if el.attrib.get("name") == context_driver:
                    search_root = el
                    break

        # Look for the target within that subtree
        for el in search_root.iter():
            if el.attrib.get("name") == name:
                return el

        # Fallback: global search (just in case the driver context failed)
        for el in self.root.iter():
            if el.attrib.get("name") == name:
                return el

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
    r"""(?P<name>[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)
        \s*\.presence\s*=\s*["'](?P<vis>visible|hidden)["']
        (?:\s*;|\s*(?=[}\n]))   # allow semicolon OR brace OR newline
    """,
    re.IGNORECASE | re.VERBOSE,
)


def _strip_js_comments(js: str) -> str:
    js = _JS_COMMENT_BLOCK.sub("", js)
    js = _JS_COMMENT_SLASHSLASH.sub("", js)
    return js


def _presence_to_effect(vis: str) -> str:
    return "SHOW" if vis.lower() == "visible" else "HIDE"


def _is_complement(a: str, b: str) -> bool:
    base_a, na = strip_not(a)
    base_b, nb = strip_not(b)
    return base_a == base_b and (na ^ nb)


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

    # JSONForms-friendly: scope points directly to the radio group field
    scope = f"#/properties/{group}"
    schema = {"const": label}

    if baseline == "hidden":
        return {"effect": "SHOW", "condition": {"scope": scope, "schema": schema}}
    else:
        return {
            "effect": "HIDE",
            "condition": {"scope": scope, "schema": {"not": schema}},
        }


def _clean_js_condition_value(value: str):
    """
    Remove Adobe JS fragments like 'this.rawValue == ...'
    and convert string numerics to int when appropriate.
    """
    if isinstance(value, str):
        m = re.match(r"^\s*this\.rawValue\s*==\s*(.*)", value)
        if m:
            value = m.group(1).strip()
        # remove stray quotes
        value = value.strip("\"'")
        # try numeric cast
        if re.fullmatch(r"\d+", value):
            return int(value)
    return value


class VisibilityRulesEngine:
    def __init__(self, group_to_label, member_to_group, get_default_presence):
        self.group_to_label = group_to_label
        self.member_to_group = member_to_group
        self.get_default_presence = get_default_presence

    def to_jsonforms_rules(
        self, rules_map: Dict[str, "ElementRules"]
    ) -> Dict[str, dict]:
        """
        Generate unified JSONForms-compatible visibility rules for all controls.
        Supports radio-driven and generic multi-field conditions.
        """
        result = {}

        for name, er in rules_map.items():
            # --- Try radio collapse first ---
            radio_rule = _radio_collapse_for_target_full(
                name,
                er.rules,
                group_to_label=self.group_to_label,
                member_to_group=self.member_to_group,
                get_default_presence=self.get_default_presence,
            )

            if radio_rule:
                result[name] = {"rule": radio_rule}
                continue

            # --- Build generic rule list ---
            rule_list = []
            for r in er.rules:
                clean_value = _clean_js_condition_value(r.condition_value)
                rule_list.append(
                    {
                        "effect": r.effect.upper(),
                        "driver": r.driver,
                        "condition": {
                            "scope": f"#/properties/{r.driver}",
                            "schema": {"const": clean_value},
                        },
                    }
                )

            if not rule_list:
                continue

            # --- Deduplicate & handle contradictions ---
            normalized: Dict[str, dict] = {}
            contradictions = []

            for r in rule_list:
                cond_key = json.dumps(r["condition"], sort_keys=True)
                eff = r["effect"].lower()

                if cond_key in normalized:
                    prev_eff = normalized[cond_key]["effect"].lower()
                    if prev_eff != eff:
                        contradictions.append((name, r["condition"]))
                        normalized.pop(cond_key, None)
                        continue
                    continue
                normalized[cond_key] = r

            if contradictions:
                print(
                    f"⚠️  Contradictory rules for {name}: {len(contradictions)} dropped"
                )

            rule_list = list(normalized.values())
            if not rule_list:
                continue

            # --- Multi-driver case → build properties schema ---
            drivers = {r["driver"] for r in rule_list if r.get("driver")}
            if len(drivers) > 1:
                properties = {}
                for r in rule_list:
                    drv = r["driver"]
                    if not drv:
                        continue
                    const_val = r["condition"]["schema"].get("const")
                    properties[drv] = {"const": const_val}
                result[name] = {
                    "rule": {
                        "effect": "SHOW",
                        "condition": {
                            "scope": "#/properties",
                            "schema": {"properties": properties},
                        },
                    }
                }
                continue

            # --- Single-rule case ---
            if len(rule_list) == 1:
                result[name] = {"rule": rule_list[0]}
            else:
                result[name] = {"rule": rule_list}
        return result
