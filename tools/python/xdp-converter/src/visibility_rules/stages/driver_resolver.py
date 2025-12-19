from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_RADIO_GROUPS,
    CTX_RAW_RULES,
    CTX_RESOLVED_RULES,
    CTX_SUBFORM_MAP,
    CTX_TARGETED_GROUPS,
)

from visibility_rules.stages.print_event import print_event
from visibility_rules.stages.trigger_ast import (
    AtomicCondition,
    CompoundCondition,
    Trigger,
)

debug = True


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
        print("\n[DriverResolver] Starting...")

        events = context.get(CTX_RAW_RULES, []) or []
        radio_groups = context.get(CTX_RADIO_GROUPS, {}) or {}
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}
        subform_map = context.get(CTX_SUBFORM_MAP, {}) or {}

        targeted_subforms = context.get(CTX_TARGETED_GROUPS)
        if targeted_subforms is None:
            targeted_subforms = set()
            context[CTX_TARGETED_GROUPS] = targeted_subforms

        resolved_events = []

        for ev in events:
            if not ev or not ev.trigger or not ev.action:
                continue

            # 1) mark subform targets
            tgt = ev.action.target
            if tgt and tgt in subform_map:
                targeted_subforms.add(tgt)

            # 2) rewrite trigger AST
            new_trigger = self._rewrite_trigger(
                ev.trigger,
                ev,
                radio_groups,
                enum_maps,
            )

            ev2 = type(ev)(
                trigger=new_trigger,
                action=ev.action,
                metadata=ev.metadata,
                script_node=ev.script_node,
            )

            if debug:
                events_of_interest = {
                    "Section3Default",
                    "Section3Emergency",
                    "Section3Seasonal",
                }
                print_event(ev2, events_of_interest)

            resolved_events.append(ev2)

        context[CTX_RESOLVED_RULES] = resolved_events
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

    def _rewrite_atomic(self, atom, ev, radio_groups, enum_maps):
        """
        Rewrite one AtomicCondition:
          - resolve driver 'this' -> owner_name
          - enforce no '.rawValue'
          - collapse member drivers to group driver where applicable
          - map value to enum label when we can
        """

        driver = (atom.driver or "").strip()
        value = atom.value

        # --- Contract: rawValue must not appear at this stage ---
        if ".rawValue" in driver:
            raise ValueError(
                f"[DriverResolver] Contract violation: '.rawValue' leaked into DriverResolver: {driver!r} "
                f"(owner={getattr(ev.metadata, 'owner_name', None)!r})"
            )

        # --- Resolve 'this' driver using metadata owner ---
        if driver.lower() == "this":
            owner_name = getattr(ev.metadata, "owner", None)
            if not owner_name:
                raise ValueError(
                    "[DriverResolver] Cannot resolve 'this': missing metadata.owner_name"
                )
            driver = owner_name

        # Normalize dotted drivers to leaf for membership checks, but preserve full when needed
        leaf = driver.split(".")[-1] if driver else driver

        # --- Faux-radio collapse: if leaf is a member checkbox, driver becomes group ---
        group = self._group_for_member(leaf, radio_groups)
        if group:
            # If the trigger is like: chkAdditional == 1  ==> Section2 == <label>
            # or: Section2.chkAdditional == 1 ==> Section2 == <label>
            # Interpret "== 1" as selecting that member.
            driver = group
            value = self._member_value_to_label(
                group, leaf, value, enum_maps, radio_groups, atom
            )

        else:
            # Not a member: normalize driver to leaf (matches your old behaviour)
            driver = leaf

            # If driver itself is a known radio group, map numeric value -> label
            if driver in radio_groups:
                value = self._index_to_label(driver, value, enum_maps)

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
        self, group: str, member_leaf: str, value, enum_maps, radio_groups, atom
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
