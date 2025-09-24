from typing import Dict, List, Optional, Set

from rule_generator.element_rules import ElementRules, Rule
from rule_generator.regular_expressions import COND_EQ_ANY_LHS_RE
from xdp_parser.xdp_utils import strip_not


class RadioRules:
    def __init__(
        self,
        group_to_button_map: Dict[str, List[str]],
        button_to_group_map: Dict[str, str],
        get_default_presence,
        debug: bool = False,
    ):
        self.group_to_button_map = group_to_button_map
        self.button_to_group_map = button_to_group_map
        self.get_default_presence = get_default_presence
        self.debug = debug

    # --- helpers: consistent label + domain -------------------------------------

    def _label_for(self, group: str, member: str) -> str:
        """Return the human label for a member in a group; fall back to member name."""
        return self.group_to_button_map.get(group, {}).get(member, member)

    def _domain_for(self, group: str) -> list[str]:
        """
        Domain of values for a group, preferring human labels; falls back to member names.
        Ensures the same representation is used everywhere (bucketer + emitter).
        """
        mapping = self.group_to_button_map.get(group, {})
        labels = [v for v in mapping.values() if v]
        return labels if labels else list(mapping.keys())

    # --- parse condition helper (resolves `this` via rule.driver) ---------------

    def _extract_member_eq1(self, r: "Rule") -> str | None:
        """
        If r.condition is '<member>.rawValue == 1' (ignoring NOT(...)), return member.
        Resolves 'this' to r.driver. Returns None otherwise.
        """
        base, is_neg = strip_not(r.condition_value)
        if is_neg:
            return None
        m = COND_EQ_ANY_LHS_RE.match(base)
        if not m:
            return None
        lhs = (m.group("lhs") or "").strip()
        val = (m.group("val") or "").strip()
        if val != "1":
            return None
        return r.driver if lhs == "this" else lhs

    # --- bucket effects by (group,label) ----------------------------------------

    def _bucket_effects_by_group_value(self, rules_map):
        """
        Build a map: (group, label) -> target -> list[effect] from atoms 'member == 1'.
        Uses _label_for() so labels are consistent with _domain_for().
        """
        bucket: dict[tuple[str, str], dict[str, list[str]]] = {}
        unknown: set[str] = set()

        for target, er in rules_map.items():
            for r in er.rules:
                driver = self._extract_member_eq1(r)
                if not driver or driver == target:
                    continue

                group = self.button_to_group_map.get(driver)
                if not group:
                    unknown.add(driver)
                    continue

                label = self._label_for(group, driver)  # <-- consistent label
                bucket.setdefault((group, label), {}).setdefault(target, []).append(
                    r.effect
                )

        if unknown and getattr(self, "debug", False):
            print(f"[radio] unknown drivers (not in maps): {sorted(unknown)}")

        return bucket

    # --- final emitter: radios via D/S sets -------------------------------------

    def to_jsonforms_rules(self, rules_map):
        """
        Emit rules based on radio behavior:

          - If target baseline is VISIBLE (default bucket):
              visible values V = domain \ D, where D = {labels that issued HIDE}
              -> emit HIDE when group ∈ D  (no rule if D is empty)

          - If target baseline is HIDDEN (owned sections):
              visible values V = S, where S = {labels that issued SHOW}
              -> emit SHOW when group ∈ S  (no rule if S is empty)
        """
        out: dict[str, dict] = {}

        bucket = self._bucket_effects_by_group_value(rules_map)

        # Which group touches each target (first seen wins; adequate for Section2 radios)
        target_groups: dict[str, str] = {}
        for (g, lbl), effs in bucket.items():
            for t in effs.keys():
                target_groups.setdefault(t, g)

        for target in rules_map.keys():
            g = target_groups.get(target)
            if not g:
                continue  # not radio-driven

            domain = self._domain_for(g)
            D, S = set(), set()
            for label in domain:
                effects = bucket.get((g, label), {}).get(target, [])
                if "HIDE" in effects:
                    D.add(label)
                if "SHOW" in effects:
                    S.add(label)

            real_baseline_vis = (
                self.get_default_presence(target) or "visible"
            ).lower() == "visible"

            # NEW: if it has any SHOWs and it’s NOT the default bucket, treat as owned
            is_named_default = "default" in (target or "").lower()
            if S and not is_named_default:
                baseline_vis = False
            else:
                baseline_vis = real_baseline_vis

            if self.debug:
                print(
                    f"[radio-DS] {target}: baseline_real={'vis' if real_baseline_vis else 'hid'} "
                    f"baseline_eff={'vis' if baseline_vis else 'hid'} D={sorted(D)} S={sorted(S)} domain={domain}"
                )

            if baseline_vis:
                # Default bucket => HIDE on D
                if D:
                    out[target] = {
                        "effect": "HIDE",
                        "condition": {
                            "scope": "#",
                            "schema": {
                                "required": [g],
                                "properties": {g: {"enum": sorted(D)}},
                            },
                        },
                    }
                    if self.debug:
                        print(f"[emit-default] {target}: HIDE when {g} in {sorted(D)}")
                else:
                    if self.debug:
                        print(f"[emit-default] {target}: visible for all; no rule")
            else:
                # Owned => SHOW on S
                if S:
                    out[target] = {
                        "effect": "SHOW",
                        "condition": {
                            "scope": "#",
                            "schema": {
                                "required": [g],
                                "properties": {g: {"enum": sorted(S)}},
                            },
                        },
                    }
                    if self.debug:
                        print(f"[emit-owned] {target}: SHOW when {g} in {sorted(S)}")
                else:
                    if self.debug:
                        print(f"[emit-owned] {target}: no SHOW values; skipping rule")
        return out
