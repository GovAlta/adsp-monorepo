# visibility_rules/static_hidden_pruner.py

from xml.etree import ElementTree as ET

from visibility_rules.pipeline_context import (
    CTX_JSONFORMS_RULES,
    CTX_PARENT_MAP,
    CTX_XDP_ROOT,
)
from xdp_parser.xdp_utils import compute_full_xdp_path

debug = False


class StaticHiddenPruner:
    """
    Removes XDP elements that are:
      - presence="hidden" in the XDP, AND
      - have no dynamic SHOW/HIDE rules (for themselves or their descendants)

    Rationale:
      - If Adobe marks a block as hidden and no JavaScript ever toggles it,
        it never appears in the PDF UI.
      - In JSONForms, elements with no rules are always visible.
      - So these static-hidden elements should be removed from the parsed tree.

    This stage must run AFTER JsonFormsEmitter, so that CTX_JSONFORMS_RULES
    is available in the context.
    """

    def process(self, context: dict) -> dict:
        root: ET.Element | None = context.get(CTX_XDP_ROOT)
        parent_map: dict[ET.Element, ET.Element] = context.get(CTX_PARENT_MAP) or {}
        jsonforms_rules: dict = context.get(CTX_JSONFORMS_RULES) or {}

        print("\n[StaticHiddenPruner] Starting...")

        if root is None:
            print("[StaticHiddenPruner] No XDP root in context; skipping.\n")
            return context

        # Keys are fully-qualified targets like "Section3Default", "Section3Seasonal.Decals", etc.
        rule_keys = list(jsonforms_rules.keys())
        print(f"[StaticHiddenPruner] Dynamic rule targets: {len(rule_keys)}")
        if debug:
            print("[StaticHiddenPruner] Sample rule keys:", rule_keys[:10])

        # Build a quick lookup to see if a name participates in any rule, either
        # as the actual target or as an ancestor of a target.
        def has_dynamic_rules_for(full_name: str) -> bool:
            if not full_name:
                return False

            for key in rule_keys:
                if key == full_name:
                    return True
                if key.startswith(full_name + "."):  # full_name is ancestor of key
                    return True
                if full_name.startswith(key + "."):  # key is ancestor of full_name
                    return True
                if full_name.endswith("." + key):  # key is suffix of full_name
                    return True
            return False

        # Collect elements to remove so we don't mutate while iterating.
        to_remove: list[ET.Element] = []

        for el in list(root.iter()):
            # Only care about UI-ish containers/fields; avoid nuking scripts etc.
            tag_local = el.tag.split("}")[-1]  # strip namespace if any
            if tag_local not in ("subform", "field", "draw", "exclGroup"):
                continue

            presence = el.attrib.get("presence", "").strip().lower()
            if presence != "hidden":
                continue

            # Compute fully-qualified XDP path for this node
            full_name = compute_full_xdp_path(el, parent_map)
            if not full_name:
                # No name/path → be conservative and keep
                continue

            if has_dynamic_rules_for(full_name):
                continue

            # At this point: presence=hidden and no rules on self/descendants
            to_remove.append(el)

        print(f"[StaticHiddenPruner] Candidates for removal: {len(to_remove)}")

        removed_count = 0
        for el in to_remove:
            parent = parent_map.get(el)
            if parent is None:
                # Don't remove the root, even if hidden
                full_name = compute_full_xdp_path(el, parent_map)
                print(
                    f"  [SKIP] Wanted to remove '{full_name}' but it has no parent (root?)."
                )
                continue

            full_name = compute_full_xdp_path(el, parent_map)
            try:
                parent.remove(el)
                removed_count += 1
                print(
                    f"  [REMOVE] Statically hidden element '{full_name}' "
                    f"(presence=hidden, no dynamic rules)."
                )
            except Exception as ex:
                print(f"  [WARN] Failed to remove '{full_name}': {ex!r}")

        print(
            f"[StaticHiddenPruner] Removed {removed_count} statically hidden elements.\n"
        )

        # We don't need to modify CTX_JSONFORMS_RULES, since we only removed
        # elements that had no rules on them or their descendants.
        return context
