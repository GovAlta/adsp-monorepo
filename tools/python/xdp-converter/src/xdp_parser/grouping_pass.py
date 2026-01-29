import xml.etree.ElementTree as ET
from typing import List, Tuple
from xdp_parser.help_pairer import HelpPairer
from xdp_parser.row_maker import RowMaker
from xdp_parser.control_description_extractor import ControlDescriptionExtractor
from xdp_parser.control_labels import ControlLabels
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.parse_context import ParseContext
from xdp_parser.pseudo_radio_transformer import transform_pseudo_radios_in_subform
from xdp_parser.subform_label import promote_group_headers
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_subform_placeholder import XdpSubformPlaceholder
from xdp_parser.xdp_utils import convert_to_mm

debug = False


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

        # Identify headers
        promote_group_headers(subform, grouped_children, debug=False)

        self.control_labels.augment_labels_with_iconic_help(grouped_children)

        extractor = ControlDescriptionExtractor()
        grouped_children = extractor.update_control_descriptions(
            grouped_children, self.control_labels
        )

        # Pair help icons
        pairer = HelpPairer(debug=True)
        grouped_children = pairer.consolidate_help_pairs(
            grouped_children,
            context=self.context,
        )

        row_maker = RowMaker()
        grouped_children = row_maker.consolidate_rows(
            subform, grouped_children, self.context
        )

        # Transform pseudo radio subforms into radio selectors
        grouped_children = transform_pseudo_radios_in_subform(
            subform, grouped_children, self.context
        )

        self.child_map[id(subform)] = grouped_children

        # Decide grouping using sorted children
        # if self.should_group_subform(subform, grouped_children, resolved_label):
        #     group = self._build_group_from_subform(
        #         subform, grouped_children, resolved_label
        #     )
        #     return [group] if group else grouped_children

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
    def should_group_subform(
        self,
        subform: ET.Element,
        elements: list[XdpElement],
        resolved_label: str | None,
    ) -> bool:
        # If we extracted a header, we must group — otherwise we have nowhere to render it
        if resolved_label and resolved_label.strip():
            return True

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

    def _build_group_from_subform(
        self,
        subform: ET.Element,
        elements: list[XdpElement],
        resolved_label: str | None,
    ) -> XdpGroup | None:
        if not elements:
            return None
        return self.factory.handle_group(subform, elements, resolved_label)


def print_subform_map(subform, grouped_children):
    print(f"[{subform.get('name')}] sorted order:")
    for k, e in enumerate(grouped_children[:8]):
        t = "CTRL" if e.is_control() else ("HELP" if e.is_help_text() else "OTHER")
        print(f"  {k:02d} {t:4} name={e.get_name()} x={e.x} y={e.y} h={e.h}")
