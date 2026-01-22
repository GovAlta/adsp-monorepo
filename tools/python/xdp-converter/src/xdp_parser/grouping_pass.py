import xml.etree.ElementTree as ET
from typing import List, Optional, Tuple
from xdp_parser.control_description_extractor import ControlDescriptionExtractor
from xdp_parser.control_labels import ControlLabels
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.help_text_extractor import HelpTextExtractor
from xdp_parser.parse_context import ParseContext
from xdp_parser.pseudo_radio_transformer import transform_pseudo_radios_in_subform
from xdp_parser.subform_label import (
    get_subform_header,
    strip_header_element,
)
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_control_pair import XdpHelpControlPair
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_subform_placeholder import XdpSubformPlaceholder
from xdp_parser.xdp_utils import convert_to_mm

debug = True


class XdpGroupingPass:
    """
    Single-responsibility pass that:
      - consumes XdpSubformPlaceholder nodes
      - recursively groups their children
      - decides whether the subform should be a Group or be flattened
    """

    def __init__(
        self,
        factory: AbstractXdpFactory,
        control_labels: ControlLabels,
        context: ParseContext,
    ) -> None:
        self.factory = factory
        self.context = context
        self.child_map = {}
        # TODO get rid of this and pass context explicitly to resolve_group_label
        self.context.child_map = self.child_map
        self.control_labels = control_labels

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
        if not isinstance(node, XdpSubformPlaceholder):
            return [node]

        subform = node.subform_elem

        grouped_children: List[XdpElement] = []
        for child in node.children:
            grouped_children.extend(self._group_node(child, parent_label=parent_label))

        # Sort
        grouped_children = self.sort_elements_for_subform(
            subform, grouped_children, self.context.get("parent_map", {})
        )

        # Extract header BEFORE pairing
        resolved_label, header_index = get_subform_header(
            subform, grouped_children, debug
        )

        if debug:
            print(f"[{subform.get('name')}] label='{resolved_label}'")

        if header_index is not None:
            grouped_children = strip_header_element(grouped_children, header_index)

        if debug:
            print_subform_map(subform, grouped_children)

        extractor = ControlDescriptionExtractor()
        grouped_children = extractor.extract(grouped_children, self.control_labels)

        # Pair help icons with controls
        grouped_children = self._consolidate_help_control_pairs(grouped_children)

        # # Transform pseudo radio subforms into radio selectors
        grouped_children = transform_pseudo_radios_in_subform(
            subform, grouped_children, self.context
        )

        self.child_map[id(subform)] = grouped_children

        # 4) Decide grouping using sorted children (header already handled)
        if self.should_group_subform(subform, grouped_children):
            group = self._build_group_from_subform(
                subform, grouped_children, resolved_label
            )
            return [group] if group else grouped_children

        return grouped_children

    @staticmethod
    def sort_elements_for_subform(
        subform: ET.Element,
        elements: List[XdpElement],
        parent_map: dict,
    ) -> List[XdpElement]:
        layout = XdpGroupingPass.resolve_effective_layout(subform, parent_map)

        if layout == "tb":
            return XdpGroupingPass._flow_sort_tb(elements)

        if layout == "lr-tb":
            return XdpGroupingPass._flow_sort_lr_tb(subform, elements)

        # Non-flow containers: geometry sort
        return sorted(
            elements,
            key=lambda e: (
                e.y if e.y is not None else float("inf"),
                e.x if e.x is not None else float("inf"),
            ),
        )

    @staticmethod
    def resolve_effective_layout(subform: ET.Element, parent_map: dict) -> str:
        cur = subform
        while cur is not None:
            raw = cur.get("layout")
            if raw:
                return raw.strip().lower()
            cur = parent_map.get(cur)
        return "tb"  # XFA default-y behavior in practice for many templates

    @staticmethod
    def _flow_sort_lr_tb(
        subform: ET.Element, elements: List["XdpElement"]
    ) -> List["XdpElement"]:
        sub_w = convert_to_mm(subform.get("w"))
        if sub_w is None:
            widths = [e.w for e in elements if e.w is not None]
            sub_w = max(widths) if widths else 190.5

        cursor_x = 0.0
        cursor_y = 0.0
        row_h = 0.0

        placed: list[tuple[float, float, int, "XdpElement"]] = []

        for idx, e in enumerate(elements):
            # positioned element (explicit x+y): honor it, but DON'T advance the flow cursor
            if (
                e.has_explicit_x
                and e.has_explicit_y
                and e.x is not None
                and e.y is not None
            ):
                placed.append((float(e.y), float(e.x), idx, e))
                continue

            # flow element
            w = float(e.w) if e.w is not None else float(sub_w)
            h = float(e.effective_height())

            if cursor_x > 0.0 and (cursor_x + w) > float(sub_w) + 0.01:
                cursor_y += row_h
                cursor_x = 0.0
                row_h = 0.0

            px = cursor_x
            py = cursor_y
            placed.append((py, px, idx, e))

            cursor_x += w
            row_h = max(row_h, h)

        placed.sort(key=lambda t: (t[0], t[1], t[2]))
        return [t[3] for t in placed]

    @staticmethod
    def _flow_sort_tb(elements: List["XdpElement"]) -> List["XdpElement"]:
        """
        tb layout:
        - Elements with explicit Y are positioned (absolute-ish) and do NOT consume flow.
        - Elements without explicit Y are flow items; they stack from the top in document order.
        """
        flow_cursor_y: float = 0.0
        placed: List[Tuple[float, float, int, "XdpElement"]] = []

        for idx, e in enumerate(elements):
            if e.has_explicit_y and e.y is not None:
                sy = float(e.y)  # positioned element: honor y
            else:
                sy = flow_cursor_y  # flow element: place at flow cursor
                flow_cursor_y += (
                    e.effective_height()
                )  # ONLY flow items advance the cursor

            sx = float(e.x) if e.x is not None else float("inf")
            placed.append((sy, sx, idx, e))

        placed.sort(key=lambda t: (t[0], t[1], t[2]))  # stable
        return [t[3] for t in placed]

    # --------------------------------------------------
    # Grouping heuristics
    # --------------------------------------------------
    def should_group_subform(self, subform, elements):
        real_controls = [e for e in elements if e.is_control()]
        num_controls = len(real_controls)
        if num_controls <= 1:
            return False
        if self._rules_target_subform(subform, real_controls):
            return True
        if num_controls >= 3:
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
        self,
        subform: ET.Element,
        elements: list[XdpElement],
        resolved_label: str | None,
    ) -> XdpGroup | None:
        if not elements:
            return None
        return self.factory.handle_group(subform, elements, resolved_label)

    def _consolidate_help_control_pairs(
        self, elements: List[XdpElement]
    ) -> List[XdpElement]:
        """
        Walk a fully-parsed + ordered element list and wrap HelpText + Control/Group
        into a XdpHelpControlPair.

        Strategy:
          1) traversal-based association (help.traversal -> target name)
          2) bbox-overlap association with prev/next *control* neighbors
        """
        out: List[XdpElement] = []
        i = 0

        while i < len(elements):
            cur = elements[i]

            if cur.is_help_icon():
                paired = self._try_pair_help(elements, out, i)
                if paired is not None:
                    pair_elem, next_i, replace_prev = paired

                    if replace_prev:
                        # replace last output element (prev) with the pair
                        out[-1] = pair_elem
                    else:
                        out.append(pair_elem)

                    i = next_i
                    continue

            out.append(cur)
            i += 1

        return out

    # ----------------------------
    # Pair attempt dispatcher
    # ----------------------------
    def _try_pair_help(
        self,
        elements: List[XdpElement],
        out: List[XdpElement],
        i: int,
    ) -> Optional[Tuple[XdpElement, int, bool]]:
        """
        Try to pair help element at elements[i].

        Returns:
          (pair_element, next_i, replace_prev)

        - next_i is the next input index to process (guaranteed > i)
        - replace_prev=True means "pair with previous output element"
        """
        help_el = elements[i]

        # Traversal-based: pair with named target ahead
        res = self._pair_by_traversal(elements, i, help_el)
        if res is not None:
            j, target = res
            return (
                XdpHelpControlPair(help_el, target, context=self.context),
                j + 1,
                False,
            )

        # Overlap-based: pair with prev/next control if overlapping
        res = self._pair_by_proximity(elements, out, i, help_el)
        if res is not None:
            kind, j, target = res
            if kind == "next":
                # consume next element from input
                return (
                    XdpHelpControlPair(help_el, target, context=self.context),
                    j + 1,
                    False,
                )
            else:
                # pair with previous output element (replace last output)
                return (
                    XdpHelpControlPair(help_el, target, context=self.context),
                    i + 1,
                    True,
                )

        return None

    # ----------------------------
    # Strategy 1: traversal-based association
    # ----------------------------
    def _pair_by_traversal(
        self,
        elements: List[XdpElement],
        i: int,
        help_el: XdpElement,
    ) -> Optional[Tuple[int, XdpElement]]:
        target_name = self._extract_traversal_target(help_el)
        if not target_name:
            return None

        for j in range(i + 1, len(elements)):
            if elements[j].get_name() == target_name:
                return j, elements[j]

        return None

    # ----------------------------
    # Strategy 2: prev/next bbox overlap with controls
    # ----------------------------
    def _pair_by_proximity(
        self,
        elements: list[XdpElement],
        out: list[XdpElement],
        i: int,
        help_el: XdpElement,
    ) -> tuple[str, int, XdpElement] | None:
        """
        Returns:
        ("prev", i-1, prev_el) or ("next", i+1, next_el)
        based on adjacency/proximity (not bbox intersection).
        """
        prev_el = out[-1] if out else None
        next_el = elements[i + 1] if i + 1 < len(elements) else None

        prev_score = 0.0
        if prev_el is not None and prev_el.is_control():
            prev_score = self._proximity_score(help_el, prev_el)

        next_score = 0.0
        if next_el is not None and next_el.is_control():
            next_score = self._proximity_score(help_el, next_el)

        if prev_score <= 0.0 and next_score <= 0.0:
            return None

        if next_score > prev_score:
            return "next", i + 1, next_el
        return "prev", i - 1, prev_el

    def _proximity_score(
        self, help_elem: XdpElement, control_elem: XdpElement
    ) -> float:
        hb = help_elem.visual_bbox()
        cb = control_elem.visual_bbox()
        if hb is None or cb is None:
            return 0.0

        hx1, hy1, hx2, hy2 = hb
        cx1, cy1, cx2, cy2 = cb

        # vertical overlap fraction (same-row test)
        overlap_y = min(hy2, cy2) - max(hy1, cy1)
        if overlap_y <= 0.0:
            return 0.0

        help_h = hy2 - hy1
        ctrl_h = cy2 - cy1
        denom = min(help_h, ctrl_h) if min(help_h, ctrl_h) > 0.0 else 1.0
        overlap_frac = overlap_y / denom

        # require decent same-row overlap
        if overlap_frac < 0.50:
            return 0.0

        # horizontal gap (touching edges => gap 0)
        if hx1 >= cx2:
            gap = hx1 - cx2  # help is to the right of control
        elif cx1 >= hx2:
            gap = cx1 - hx2  # help is to the left of control
        else:
            gap = 0.0  # they overlap horizontally (rare, but fine)

        # we only want "nearby"
        if gap > 6.0:  # mm, tune if needed
            return 0.0

        # score: prefer smaller gap + better vertical alignment
        # (touching => highest)
        return (1.0 / (1.0 + gap)) * 100.0 + overlap_frac * 20.0

    def _extract_traversal_target(self, help_elem: XdpHelpText) -> str | None:
        """
        If the help element contains <traversal><traverse ref="Images[0]"/></traversal>,
        return "Images". Otherwise None.
        """
        try:
            trav = help_elem.xdp_element.find(".//traversal/traverse")
            if trav is None:
                return None
            ref = (trav.get("ref") or "").strip()
            if not ref:
                return None
            # ref is often like "Images[0]" or "imgOne[0]"
            return ref.split("[", 1)[0]
        except Exception:
            return None


def print_subform_map(subform, grouped_children):
    print(f"[{subform.get('name')}] sorted order:")
    for k, e in enumerate(grouped_children[:8]):
        t = "CTRL" if e.is_control() else ("HELP" if e.is_help_text() else "OTHER")
        print(f"  {k:02d} {t:4} name={e.get_name()} x={e.x} y={e.y} h={e.h}")
