import xml.etree.ElementTree as ET
from typing import List
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.parse_context import ParseContext
from xdp_parser.subform_label import get_subform_header_label
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_control_pair import XdpHelpControlPair
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_subform_placeholder import XdpSubformPlaceholder


class XdpGroupingPass:
    """
    Single-responsibility pass that:
      - consumes XdpSubformPlaceholder nodes
      - recursively groups their children
      - decides whether the subform should be a Group or be flattened
    """

    def __init__(self, factory: AbstractXdpFactory, context: ParseContext) -> None:
        self.factory = factory
        self.context = context
        self.child_map = {}
        # TODO get rid of this and pass context explicitly to resolve_group_label
        self.context.child_map = self.child_map

    # --------------------------------------------------
    # Public entry
    # --------------------------------------------------
    def group_placeholders(self, roots: List[XdpElement]) -> List[XdpElement]:
        result: List[XdpElement] = []
        for node in roots:
            result.extend(self._group_node(node, parent_label=None))
        return result

    def _group_node(
        self, node: XdpElement, parent_label: str | None
    ) -> List[XdpElement]:
        if isinstance(node, XdpSubformPlaceholder):
            subform = node.subform_elem

            current_label = get_subform_header_label(subform)  # str | None
            effective_parent_label = current_label or parent_label

            # Recursively group children first, but with the effective parent label
            grouped_children: List[XdpElement] = []
            for child in node.children:
                grouped_children.extend(
                    self._group_node(child, parent_label=effective_parent_label)
                )

            layout = subform.get("layout")
            grouped_children = self._sort_by_geometry(grouped_children, layout)

            grouped_children = self._consolidate_help_control_pairs(grouped_children)
            self.child_map[id(subform)] = grouped_children

            # Decide grouping
            if self.should_group_subform(subform, grouped_children):
                # When building THIS group, compare its label to the *actual* parent label
                group = self._build_group_from_subform(
                    subform, grouped_children, parent_label=parent_label
                )
                return [group] if group else grouped_children

            return grouped_children

        return [node]

    # ----------------------------------------------------------------------
    # GEOMETRY SORT
    # ----------------------------------------------------------------------
    def _sort_by_geometry(
        self, elements: List[XdpElement], container_layout: str | None
    ) -> List[XdpElement]:
        layout = (container_layout or "").strip().lower()

        # Default sort (non-flow containers)
        if layout != "tb":

            def key(e: XdpElement):
                y = e.y if e.y is not None else float("inf")
                x = e.x if e.x is not None else float("inf")
                return (y, x)

            return sorted(elements, key=key)

        # --- Flow-aware sort for layout="tb" ---
        cursor_y = None
        items = []

        for idx, e in enumerate(elements):
            if getattr(e, "has_explicit_y", False) and e.y is not None:
                # Explicitly positioned element defines where the flow cursor is
                sy = e.y
                cursor_y = sy + e.effective_height()
            else:
                # Flow element: place it at cursor (or 0 if this is the first thing)
                if cursor_y is None:
                    sy = 0.0
                    cursor_y = sy + e.effective_height()
                else:
                    sy = cursor_y
                    cursor_y = sy + e.effective_height()

            x = e.x if e.x is not None else float("inf")
            items.append((sy, x, idx, e))

        items.sort(key=lambda t: (t[0], t[1], t[2]))  # idx keeps stable order
        return [t[3] for t in items]

    # --------------------------------------------------
    # Grouping heuristics
    # --------------------------------------------------
    def should_group_subform(self, subform, elements):
        """
        Decide whether this <subform> should become a Group.

        Criteria (ANY triggers grouping):
          1. Visibility rules reference ≥2 children
          2. 3+ real controls
          3. Contains radio cluster or object array
          4. Contains a section-style header (by TEXT)
        """

        # Filter real controls
        real_controls = [
            e
            for e in elements
            if e.is_control()
            or getattr(e, "is_radio", False)
            or getattr(e, "is_array", False)
        ]

        num_controls = len(real_controls)

        # Flatten trivial wrappers
        if num_controls <= 1:
            return False

        # 1) Visibility rules hitting multiple children
        if self._rules_target_subform(subform, real_controls):
            return True

        # 2) Several real controls → semantic cluster
        if num_controls >= 3:
            return True

        # 3) Radio cluster or array
        if any(
            getattr(e, "is_radio", False) or getattr(e, "is_array", False)
            for e in elements
        ):
            return True

        # 4) Help text that looks like a section header
        if get_subform_header_label(subform) is not None:
            return True

        return False

    def _rules_target_subform(self, subform, controls):
        rules = getattr(self.context, "jsonforms_rules", {}) or {}
        if not rules:
            return False

        names = {c.get_name() for c in controls}
        hits = sum(1 for n in names if n in rules)
        return hits >= 2

    def _is_section_header(self, help_elem: XdpHelpText) -> bool:
        """
        Does the help text *look* like a meaningful header?
        """

        text = (help_elem.text or "").strip()
        if not text:
            return False

        # Very strong signal: "Section N:"
        if text.startswith("Section "):
            return True

        # Header heuristic: short and ends with colon
        if text.endswith(":") and len(text) <= 60:
            return True

        return False

    def _build_group_from_subform(
        self, subform: ET.Element, elements: list[XdpElement], parent_label: str | None
    ) -> XdpGroup | None:
        if not elements:
            return None
        return self.factory.handle_group(subform, elements, parent_label)

    def _consolidate_help_control_pairs(
        self, elements: List[XdpElement]
    ) -> List[XdpElement]:
        """
        Walk a fully-parsed + ordered element list and wrap HelpText + Control
        into a XdpHelpControlPair when the help overlaps the control.

        Strategy:
          - For each XdpHelpText, check prev and next siblings (if they are controls).
          - If help overlaps exactly one neighbor -> pair with it.
          - If overlaps both -> pick the larger overlap score (or prefer the control).
          - If overlaps neither -> leave it alone.
        """

        def is_control(e: XdpElement) -> bool:
            try:
                return e.is_control()
            except Exception:
                return False

        def is_help(e: XdpElement) -> bool:
            return (
                isinstance(e, XdpHelpText)
                or getattr(e, "is_help_text", lambda: False)()
            )

        def overlap_score(help_elem: XdpElement, control_elem: XdpElement) -> float:
            """
            Simple bbox overlap area score. Returns 0 if no overlap or missing bbox.
            """
            hb = help_elem.bbox()
            cb = control_elem.bbox()
            if not hb or not cb:
                return 0.0

            hx1, hy1, hx2, hy2 = hb
            cx1, cy1, cx2, cy2 = cb

            ix1 = max(hx1, cx1)
            iy1 = max(hy1, cy1)
            ix2 = min(hx2, cx2)
            iy2 = min(hy2, cy2)

            if ix2 <= ix1 or iy2 <= iy1:
                return 0.0

            return (ix2 - ix1) * (iy2 - iy1)

        out: List[XdpElement] = []
        i = 0

        while i < len(elements):
            cur = elements[i]

            # Only attempt pairing when current node is help text
            if is_help(cur):
                prev_el = out[-1] if out else None
                next_el = elements[i + 1] if i + 1 < len(elements) else None

                prev_ok = prev_el is not None and is_control(prev_el)
                next_ok = next_el is not None and is_control(next_el)

                prev_score = overlap_score(cur, prev_el) if prev_ok else 0.0
                next_score = overlap_score(cur, next_el) if next_ok else 0.0

                # If overlap exists, choose best neighbor
                if prev_score > 0.0 or next_score > 0.0:
                    if next_score > prev_score:
                        # Pair with next: consume next_el from input stream
                        pair = XdpHelpControlPair(cur, next_el, context=self.context)
                        out.append(pair)
                        i += 2
                        continue
                    else:
                        # Pair with prev: replace the last output element with pair
                        # Ensure help is first element in the pair (as requested)
                        pair = XdpHelpControlPair(cur, prev_el, context=self.context)
                        out[-1] = pair
                        i += 1
                        continue

            # default: no pairing
            out.append(cur)
            i += 1

        return out
