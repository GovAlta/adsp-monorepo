# tools/python/xdp-converter/src/xdp_parser/parse_xdp.py

import re
import xml.etree.ElementTree as ET
from typing import List
from visibility_rules.pipeline_context import CTX_RADIO_GROUPS
from xdp_parser.control_labels import ControlLabels, inline_caption
from xdp_parser.control_helpers import is_checkbox, is_radio_button
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.group_label_resolver import resolve_group_label
from xdp_parser.orphaned_list_controls import is_add_remove_container
from xdp_parser.parse_context import ParseContext
from xdp_parser.parsing_helpers import is_object_array
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_radio_selector import extract_radio_button_labels
from xdp_parser.xdp_utils import (
    remove_duplicates,
    is_hidden,
    is_subform,
    tag_name,
)


class XdpParser:
    """
    Central traversal engine for XDP trees.
    Delegates element creation to a pluggable factory
    that implements AbstractXdpFactory.
    """

    def __init__(self, factory: AbstractXdpFactory, context: ParseContext):
        self.factory = factory
        self.context = context
        self.control_labels: ControlLabels | None = None

    # ----------------------------------------------------------------------
    # Entry point
    # ----------------------------------------------------------------------
    def parse_xdp(self) -> List[XdpElement]:
        """
        Parse the XDP, returning a structured list of factory-built controls/sections.
        """

        form_root = self.find_form_root(self.context.get("root"))
        subforms = self.find_top_subforms(form_root)
        self.control_labels = ControlLabels(form_root, self.context)

        all_elements: List[XdpElement] = []

        for subform in subforms:
            nested_controls = self.parse_subform(subform)
            if not nested_controls:
                continue

            # Top-level grouping heuristic
            if self.should_group_subform(subform, nested_controls):
                label = subform.get("name") or inline_caption(subform) or ""
                group = self.factory.handle_group(subform, nested_controls, label)
                if group:
                    all_elements.append(group)
                else:
                    all_elements.extend(nested_controls)
            else:
                all_elements.extend(nested_controls)

        # 🔹 ensure top-level groups are in visual order
        all_elements = self._sort_top_level_groups_only(all_elements)

        return remove_duplicates(self.to_form_elements(all_elements))

    def to_form_elements(self, xdp_elements: List[XdpElement]) -> List[dict]:
        form_elements: List[dict] = []
        for xdp_element in xdp_elements:
            form_element = xdp_element.to_form_element()
            if form_element:
                form_elements.append(form_element)
        return form_elements

    # ----------------------------------------------------------------------
    # Core traversal
    # ----------------------------------------------------------------------
    def parse_subform(self, subform: ET.Element) -> List[XdpElement]:
        controls: List[XdpElement] = []

        # --- Skip Add/Remove containers entirely ---
        if is_add_remove_container(
            subform, self.context.get("root"), self.context.get("parent_map")
        ):
            return []

        # --- Handle object array (List-With-Detail) ---
        if is_object_array(subform):
            row_fields = list(self.find_simple_controls(subform))
            control = self.factory.handle_object_array(
                subform, self.control_labels, row_fields
            )
            if control:
                # 👉 Even object arrays can be part of a group later
                controls.append(control)

            # Do NOT return yet — allow grouping of this subform.
            # (Old code returned early — that prevented correct grouping!)
            return self._maybe_group_subform(subform, controls)

        # --- Handle implicit radio subform (checkButton cluster) ---
        radio_labels = extract_radio_button_labels(subform)
        if radio_labels:
            control = self.factory.handle_radio_subform(subform, self.control_labels)
            if control:
                controls.append(control)

            # Again: do NOT return early
            return self._maybe_group_subform(subform, controls)

        # --- Normal subform: collect child controls ---
        child_controls = list(self.find_simple_controls(subform))
        controls.extend(child_controls)

        # --- NEW: Apply grouping logic LAST ---
        return self._maybe_group_subform(subform, controls)

    def find_simple_controls(self, node: ET.Element) -> List[XdpElement]:
        """
        Traverse a subform and return a flat list of XdpElement controls.

        NOTE: This function must only return XdpElement instances (or subclasses),
        never raw ET.Element, so downstream .to_form_element() calls are safe.
        """
        controls: List[XdpElement] = []
        elements = list(node)
        i = 0

        while i < len(elements):
            elem = elements[i]

            # Help text
            help_text = XdpHelpText.get_help_text(elem)
            if help_text:
                group_label = self._peek_group_label(node)
                print(
                    f"[Parser]  help text: '{help_text}' v.s. group label: '{group_label}'"
                )
                if group_label and help_text.strip() == group_label.strip():
                    # It is a header -> skip generating HelpContent element
                    i += 1
                    continue

                control = self.factory.handle_help_text(elem, help_text)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Explicit or implicit radio groups (exclGroup or radio-like fields)
            if is_radio_button(elem):
                control = self.factory.handle_radio(elem, self.control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Checkboxes
            if is_checkbox(elem):
                control = self.factory.handle_checkbox(elem, self.control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Basic input fields
            if elem.tag == "field":
                # Hidden + uncontrolled by rules → skip (pure structural)
                if is_hidden(elem) and not self._is_controlled_by_rules(elem):
                    i += 1
                    continue

                control = self.factory.handle_basic_input(elem, self.control_labels)
                if control:
                    controls.append(control)
                i += 1
                continue

            # Nested subforms (containers)
            if is_subform(elem):
                nested_controls = self.parse_subform(elem)

                if nested_controls:
                    if self.should_group_subform(elem, nested_controls):
                        label = elem.get("name") or inline_caption(elem) or ""
                        group = self.factory.handle_group(elem, nested_controls, label)
                        if group:
                            controls.append(group)
                        else:
                            controls.extend(nested_controls)
                    else:
                        controls.extend(nested_controls)

                i += 1
                continue

            i += 1

        return controls

    def _normalize_heading(self, text: str) -> str:
        """
        Normalize headings to check whether HelpContent duplicates a label.
        """
        if not text:
            return ""
        t = re.sub(r"\s+", " ", text).strip()
        t = re.sub(r":\s*$", "", t)  # strip trailing colon
        return t.lower()

    # ----------------------------------------------------------------------
    # Form structure helpers
    # ----------------------------------------------------------------------
    def find_form_root(self, root: ET.Element) -> ET.Element:
        """Find <template>/<subform>/<subform>."""
        template = next((el for el in root.iter() if el.tag == "template"), None)
        if not template:
            raise ValueError("Template node not found")
        level1 = next((el for el in template if el.tag == "subform"), None)
        level2 = (
            next((el for el in level1 if el.tag == "subform"), None) if level1 else None
        )
        if not level2:
            raise ValueError("Form root not found")
        return level2

    @staticmethod
    def find_top_subforms(form_root: ET.Element) -> List[ET.Element]:
        """Return first-level subforms containing logical input groups."""
        return [sf for sf in form_root if tag_name(sf.tag) == "subform"]

    def _maybe_group_subform(
        self, subform: ET.Element, elements: List[XdpElement]
    ) -> List[XdpElement]:
        if self.should_group_subform(subform, elements):
            group = self._build_group_from_subform(subform, elements, self.context)
            return [group]

        return elements

    def should_group_subform(self, subform, controls):
        layout = subform.get("layout")

        # Absolute positioning → ALWAYS group
        if layout is None or layout == "position":
            return True

        # Top-to-bottom flow → likely a single logical section
        if layout == "tb":
            return True

        # Left-to-right, flowing rows → still group is correct for UI layout
        if layout == "lr-tb":
            return True

        # Otherwise fallback to previous heuristics
        return self._default_group_heuristic(subform, controls)

    def _default_group_heuristic(
        self,
        subform: ET.Element,
        elements: list["XdpElement"],
    ) -> bool:
        """
        Decide whether this <subform> should be emitted as a Group.
        """

        name = subform.get("name") or ""

        # 1. Never group known "layout only" containers, if you have any
        #    (You can expand this list as needed.)
        layout_only_names = {
            "root",
            "Page1",
            "Page2",  # example only
        }
        if name in layout_only_names:
            return False

        # 2. Split children by type
        help_elems = [e for e in elements if e.is_help_text()]
        controls = [e for e in elements if e.is_control()]

        # 3. Strong signal: section-style header + multiple controls
        has_section_header = any(self._is_section_header(h) for h in help_elems)
        if has_section_header and len(controls) >= 2:
            return True

        # 4. Generic "cluster of controls" heuristic:
        #    many controls in one subform → probably a logical group
        if len(controls) >= 4:
            return True

        # 5. Otherwise: treat as inline / layout subform
        return False

    def _is_section_header(self, help_elem: "XdpHelpText") -> bool:
        """
        Heuristic: does this help text look like a section header?

        Right now:
        - starts with 'Section '
        - or ends with ':' and is short-ish
        """

        text = (help_elem.text or "").strip()

        if not text:
            return False

        # Explicit "Section X: ..." pattern
        if text.startswith("Section "):
            return True

        # E.g. "Current Vehicle Information:" or similar short headers
        if text.endswith(":") and len(text) <= 60:
            return True

        return False

    def _build_group_from_subform(
        self,
        subform: ET.Element,
        elements: list["XdpElement"],
        context: ParseContext,
    ) -> "XdpGroup":
        """
        Build an XdpGroup from a subform and its already-converted children.

        - Uses the first "section-like" XdpHelpText as the group label, if present.
        - Keeps that header as a HelpContent inside the group (so UI shows it).
        """

        name = subform.get("name") or ""

        header_help: XdpHelpText | None = None
        remaining: list[XdpElement] = []

        for e in elements:
            if (
                header_help is None
                and isinstance(e, XdpHelpText)
                and self._is_section_header(e)
            ):
                header_help = e
                # We *keep* it in the group (so it still renders as HelpContent)
                remaining.append(e)
            else:
                remaining.append(e)

        if header_help is not None:
            label = header_help.text.strip()
        else:
            label = name or ""

        group = XdpGroup(subform, remaining, context, label)

        return group

    # ----------------------------------------------------------------------
    # Visibility-rule awareness
    # ----------------------------------------------------------------------
    def _is_controlled_by_rules(self, elem: ET.Element) -> bool:
        """
        Returns True if there are visibility rules targeting this element.
        We check by:
          1) radio_groups membership
          2) dotted rule keys like 'Header.rbApplicant' (suffix match)
        """
        name = elem.get("name") or ""
        if not name:
            return False

        radio_groups = self.context.get(CTX_RADIO_GROUPS, {})
        if name in radio_groups:
            return True

        # dotted keys may reference this control by suffix
        for key in radio_groups.keys():
            if key.endswith(f".{name}"):
                return True

        # Also consider JSONForms rules directly targeting the field
        visibility_rules = getattr(self.context, "jsonforms_rules", {}) or {}
        if name in visibility_rules:
            return True
        for key in visibility_rules.keys():
            if key.endswith(f".{name}"):
                return True

        return False

    def _sort_by_geometry(self, xdp_elements):
        """
        Sort top-level elements using their geometry (same as in the factory).
        """

        def key(el):
            geo = getattr(el, "geometry", None)
            if not geo or geo.y is None:
                return (float("inf"), float("inf"))
            x = geo.x if geo.x is not None else float("inf")
            return (geo.y, x)

        sorted_elements = sorted(xdp_elements, key=key)

        print("[TopLevelGeomSort] Sorted top-level elements:")
        for el in sorted_elements:
            geo = getattr(el, "geometry", None)
            name = getattr(el, "get_name", lambda: "")()
            y = geo.y if geo and geo.y is not None else None
            x = geo.x if geo and geo.x is not None else None

        return sorted_elements

    def _sort_top_level_groups_only(self, groups):
        return groups

    def _peek_group_label(self, subform_elem):
        """
        Used early during parsing to detect whether a help-text
        matches the subform's group header.
        """
        try:
            return resolve_group_label(subform_elem, self.context)
        except Exception:
            return None
