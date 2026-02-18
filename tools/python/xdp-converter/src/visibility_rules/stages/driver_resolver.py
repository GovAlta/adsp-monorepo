import xml.etree.ElementTree as ET
from typing import Optional
from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_RADIO_GROUPS,
    CTX_RAW_RULES,
    CTX_RESOLVED_RULES,
    CTX_SUBFORM_MAP,
    CTX_TARGETED_GROUPS,
    CTX_PARENT_MAP,
    CTX_XDP_ROOT,
)

from visibility_rules.stages.print_event import print_event
from visibility_rules.stages.rule_model import Action, EventDescription
from visibility_rules.stages.trigger_ast import (
    AtomicCondition,
    CompoundCondition,
    Trigger,
)
from xdp_parser.xdp_utils import compute_full_xdp_path

debug = False


class DriverResolver:
    """
    Semantic rewrite of Trigger AST:
      - resolve 'this' in drivers
      - collapse faux-radio checkbox drivers to group drivers
      - map numeric values to enum labels where appropriate
      - enforce no '.rawValue' leaks into this stage

    Input : context[CTX_RAW_RULES]      -> list[EventDescription]
    Output: context[CTX_RESOLVED_RULES] -> list[EventDescription] (same count, rewritten triggers)
    Side-effect: context[CTX_TARGETED_GROUPS] includes targets that are <subform>.
    """

    def process(self, context):
        if debug:
            print("\n[DriverResolver] Starting...")

        events: list[EventDescription] = context.get(CTX_RAW_RULES, []) or []
        radio_groups = context.get(CTX_RADIO_GROUPS, {}) or {}
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}
        subform_map = context.get(CTX_SUBFORM_MAP, {}) or {}
        parent_map = context.get(CTX_PARENT_MAP, {}) or {}
        xdp_root = context.get(CTX_XDP_ROOT)

        targeted_subforms = context.get(CTX_TARGETED_GROUPS)
        if targeted_subforms is None:
            targeted_subforms = set()
            context[CTX_TARGETED_GROUPS] = targeted_subforms

        resolved_events: list[EventDescription] = []
        for ev in events:
            if not ev or not ev.trigger or not ev.action:
                continue

            # Mark subform targets
            tgt = ev.action.target
            if tgt and tgt in subform_map:
                targeted_subforms.add(tgt)

            # Rewrite trigger AST
            new_trigger = self._rewrite_trigger(
                ev.trigger,
                ev,
                radio_groups,
                enum_maps,
            )

            # Resolve action target to fully-qualified SOM path
            tgt_qualified = self._resolve_action_target(ev, parent_map, xdp_root)
            if not tgt_qualified:
                if debug:
                    print(f"[DriverResolver] WARN: could not resolve target {tgt}")
                continue

            # --- Adjust effect relative to initial presence ---
            baseline_hidden = self._is_initially_hidden(
                tgt_qualified, parent_map, xdp_root
            )

            script_hide = ev.action.hide

            # Convert script action into effective rule effect
            if baseline_hidden:
                if script_hide:
                    continue  # hiding something already hidden -> no-op
                effective_hide = False
            else:
                # Field starts visible
                if not script_hide:
                    continue  # showing something already visible -> no-op
                effective_hide = True  # this becomes a HIDE rule

            new_action = Action(target=tgt_qualified, hide=effective_hide)
            ev2 = EventDescription(
                trigger=new_trigger,
                action=new_action,
                script_node=ev.script_node,
                owner=ev.owner,
            )

            if debug:
                print_event(ev2, None)

            resolved_events.append(ev2)

        context[CTX_RESOLVED_RULES] = resolved_events
        if debug:
            print(f"[DriverResolver]: Resolved {len(resolved_events)} events")
            print("[DriverResolver] Done.\n")
        return context

    # -------------------------
    # AST rewrite
    # -------------------------

    def _rewrite_trigger(self, trigger, ev, radio_groups, enum_maps):
        node = trigger.node

        # Atomic
        if isinstance(node, AtomicCondition):
            return Trigger(self._rewrite_atomic(node, ev, radio_groups, enum_maps))

        # Compound
        if isinstance(node, CompoundCondition):
            left = self._rewrite_trigger(node.left, ev, radio_groups, enum_maps)
            right = self._rewrite_trigger(node.right, ev, radio_groups, enum_maps)
            return Trigger(CompoundCondition(left=left, op=node.op, right=right))

        raise TypeError(f"Unknown Trigger node type: {type(node)}")

    def _rewrite_atomic(self, atom, ev: EventDescription, radio_groups, enum_maps):
        """
        Rewrite one AtomicCondition:
        - resolve driver 'this' -> owner
        - enforce no '.rawValue'
        - collapse member drivers to group driver where applicable
        - map numeric values to enum labels where possible (radio OR dropdown)
        """

        driver = (atom.driver or "").strip()
        value = atom.value

        # --- Contract: rawValue must not appear at this stage ---
        if ".rawValue" in driver:
            raise ValueError(
                f"[DriverResolver] Contract violation: '.rawValue' leaked into DriverResolver: {driver!r} "
                f"(owner={ev.owner})"
            )

        # --- Resolve 'this' driver using metadata owner ---
        if driver.lower() == "this":
            owner = ev.owner
            if not owner:
                raise ValueError(
                    "[DriverResolver] Cannot resolve 'this': missing metadata.owner"
                )
            driver = owner

        # Normalize dotted drivers to leaf for membership checks, but preserve full when needed
        leaf = driver.split(".")[-1] if driver else driver

        # --- Faux-radio collapse: if leaf is a member checkbox, driver becomes group ---
        group = self._group_for_member(leaf, radio_groups)
        if group:
            driver = group
            value = self._member_value_to_label(
                group, leaf, value, enum_maps, radio_groups
            )
            value = self._resolve_enum_value(driver, value, enum_maps)

        else:
            # Not a member: normalize driver to leaf
            driver = leaf

            # If driver itself is a known radio group, map numeric -> label
            if driver in radio_groups:
                value = self._index_to_label(driver, value, enum_maps)

            # If driver is any enum-backed control,
            # map numeric/save-value -> label.
            value = self._resolve_enum_value(driver, value, enum_maps)

        return AtomicCondition(driver=driver, op=atom.op, value=value)

    # -------------------------
    # Radio helpers
    # -------------------------

    def _group_for_member(self, member_leaf: str, radio_groups: dict) -> str | None:
        for group, members in radio_groups.items():
            if member_leaf in members:
                return group
        return None

    def _member_value_to_label(
        self, group: str, member_leaf: str, value, enum_maps, radio_groups
    ):
        """
        If we collapsed member->group, turn the value into a label where possible.

        Common patterns:
          member == 1  -> group == label(member)
          member == 0  -> group != label(member)   (we *could* rewrite op, but you asked primarily about values;
                                                    we’ll keep value mapping and leave op as-is for now unless you want it)
        Also handle when 'value' is literally the member name.
        """
        members = radio_groups.get(group) or []
        idx = (members.index(member_leaf) + 1) if member_leaf in members else None
        label = enum_maps.get(group, {}).get(str(idx)) if idx else None

        # If value is the member name itself, map it
        if isinstance(value, str) and value.strip() == member_leaf:
            return label or (str(idx) if idx else value)

        # If value is "1" meaning selected
        s = str(value).strip() if value is not None else ""
        if s.isdigit():
            # "1"/"0" are common checkbox states; "1" means selected
            if s == "1":
                return label or (str(idx) if idx else value)
            # if it's "2"/"3" etc, treat as index (some scripts do this)
            mapped = enum_maps.get(group, {}).get(s)
            return mapped or value

        # Otherwise leave as-is
        return value

    def _index_to_label(self, group: str, value, enum_maps: dict):
        if value is None:
            return value
        s = str(value).strip()
        if s.isdigit():
            return enum_maps.get(group, {}).get(s) or value
        return value

    def _strip_quotes(self, s: str) -> str:
        s = (s or "").strip()
        if len(s) >= 2 and ((s[0] == s[-1]) and s[0] in ("'", '"')):
            return s[1:-1]
        return s

    def _resolve_enum_value(self, driver: str, value: str, enum_maps: dict) -> str:
        """
        Resolve numeric enum values to labels.

        Special case:
        - If the resolved label is blank, return empty string "".
            This represents an unselected / placeholder value in XDP.
        """
        if not driver or value is None:
            return value

        mapping = enum_maps.get(driver)
        if not mapping:
            return value

        key = self._strip_quotes(str(value)).strip()
        if key in mapping:
            label = mapping[key]
            # IMPORTANT: blank label is meaningful → empty string
            return (label or "").strip()

        return value

    def _resolve_action_target(
        self,
        ev: EventDescription,
        parent_map: dict[ET.Element, ET.Element],
        xdp_root: Optional[ET.Element],
    ) -> str:
        raw = (ev.action.target or "").strip()
        if not raw:
            return ""

        # Already qualified? Great.
        if "." in raw:
            return raw

        if xdp_root is None or ev.script_node is None:
            return ""

        # Resolve within the nearest subform containing this script
        scope = self._nearest_subform_ancestor(ev.script_node, parent_map)
        if scope is not None:
            hit = self._find_descendant_by_name(scope, raw)
            if hit is not None:
                return compute_full_xdp_path(hit, parent_map)

        # If not found in local scope, only fall back globally if UNIQUE
        matches = self._find_all_by_name(xdp_root, raw)
        if len(matches) == 1:
            return compute_full_xdp_path(matches[0], parent_map)

        # Ambiguous or missing -> fail (better than mis-attaching)
        return ""

    def _nearest_subform_ancestor(
        self,
        node: ET.Element,
        parent_map: dict[ET.Element, ET.Element],
    ) -> Optional[ET.Element]:
        cur: Optional[ET.Element] = node
        while cur is not None:
            tag = (cur.tag or "").split("}")[-1]
            if tag == "subform":
                return cur
            cur = parent_map.get(cur)
        return None

    def _find_descendant_by_name(
        self, scope: ET.Element, name: str
    ) -> Optional[ET.Element]:
        for el in scope.iter():
            if el.attrib.get("name") == name:
                return el
        return None

    def _find_all_by_name(self, root: ET.Element, name: str) -> list[ET.Element]:
        out: list[ET.Element] = []
        for el in root.iter():
            if el.attrib.get("name") == name:
                out.append(el)
        return out

    def _is_initially_hidden(
        self,
        qualified_target: str,
        parent_map,
        xdp_root,
    ) -> bool:
        if not qualified_target or xdp_root is None:
            return False

        # Find node by full SOM path
        for el in xdp_root.iter():
            name = el.attrib.get("name")
            if not name:
                continue

            full = compute_full_xdp_path(el, parent_map)
            if full == qualified_target:
                return (el.attrib.get("presence") or "").strip().lower() == "hidden"

        return False
