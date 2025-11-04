import xml.etree.ElementTree as ET
from typing import Dict, List, Tuple, Set
import re

from rule_generator.gather_label_text import gather_label_text
from xdp_parser.xdp_utils import tag_name


class ParseSelectors:
    def __init__(self, root: ET.Element, debug: bool = False):
        self.root = root
        self.debug = debug

    def _find_excl_groups(self) -> Dict[str, Dict[str, str]]:
        """
        Return: { group_name: { member_field_name: label } } using <exclGroup>.
        """
        radio_btn_group: Dict[str, Dict[str, str]] = {}
        for ex in self.root.iter():
            if tag_name(ex.tag) != "exclGroup":
                continue
            radio_name = ex.attrib.get("name") or "radioGroup"
            options: Dict[str, str] = {}
            # iterate descendants; <field> elements may contain an option
            for field in ex.iter():
                if tag_name(field.tag) != "field":
                    continue
                field_name = field.attrib.get("name")
                if not field_name:
                    continue
                label = gather_label_text(field) or field_name
                options[field_name] = label
            # keep only if there are at least two options
            if len(options) >= 2:
                radio_btn_group[radio_name] = options
        return radio_btn_group

    def _find_radio_like_clusters(self) -> Dict[str, Dict[str, str]]:
        """
        Heuristic radios (no <exclGroup>): find <subform> containers that
        have 2+ fields with round checkButtons and scripts that uncheck others.
        Returns: { group_name: { member_field_name: label } }
        """
        clusters: Dict[str, Dict[str, str]] = {}

        for container in self.root.iter():
            if tag_name(container.tag) != "subform":
                continue

            # collect direct/descendant fields in this container
            fields: List[ET.Element] = [
                f for f in container.iter() if tag_name(f.tag) == "field"
            ]
            round_fields = [f for f in fields if self._is_round_checkbutton(f)]
            if len(round_fields) < 2:
                continue

            # look for "uncheck others" pattern across container scripts
            scripts = "\n".join(self._iter_scripts_in(container))
            uncheck_targets = _collect_uncheck_targets(scripts)
            member_names = [
                f.attrib.get("name") for f in round_fields if f.attrib.get("name")
            ]

            # heuristic: at least one other member is being cleared somewhere
            has_cross_uncheck = (
                len(uncheck_targets.intersection(set(member_names))) >= 1
            )
            if not has_cross_uncheck:
                continue

            group_name = container.attrib.get("name") or "RadioGroup"
            group: Dict[str, str] = {}
            for fld in round_fields:
                fname = fld.attrib.get("name")
                if not fname:
                    continue
                lbl = gather_label_text(fld, self.root) or fname
                group[fname] = lbl

            if len(group) >= 2:
                clusters[group_name] = group

        return clusters

    def _looks_like_option_field(self, fld: ET.Element) -> bool:
        name = (fld.attrib.get("name") or "").lower()
        if not name:
            return False
        # accept common prefixes
        if name.startswith(("chk", "rb")):
            return True
        # also accept fields with round/circle checkButton (radio-like)
        return self._is_round_checkbutton(fld)

    def build_radio_button_mappings(self, root):
        """
        Build mappings for radio button relationships in an XDP form.

        Returns:
            (radio_group_members, radio_member_to_group)

        radio_group_members:
            dict[str, dict[str, str]]  →  radio group → { member field name → display label }
            e.g. { "rbApplicant": { "rbAdult": "Adult Health", "rbChild": "Child Health" } }

        radio_member_to_group:
            dict[str, str]  →  individual radio field → its parent group name
            e.g. { "rbAdult": "rbApplicant", "rbChild": "rbApplicant" }
        """
        radio_group_members: dict[str, dict[str, str]] = {}
        radio_member_to_group: dict[str, str] = {}

        # Find all <exclGroup> nodes (radio button groups)
        for excl_group in root.findall(".//exclGroup"):
            group_name = excl_group.attrib.get("name")
            if not group_name:
                continue

            group_members: dict[str, str] = {}

            # Each <field> inside the group is a radio option
            for field in excl_group.findall(".//field"):
                field_name = field.attrib.get("name")
                if not field_name:
                    continue

                # Extract the visible caption text
                caption_node = field.find(".//caption/value/text")
                label = ""
                if caption_node is not None and caption_node.text:
                    label = caption_node.text.strip()
                else:
                    # Fallback: use the name if no caption found
                    label = field_name

                group_members[field_name] = label
                radio_member_to_group[field_name] = group_name

            # Store mapping for this group
            if group_members:
                radio_group_members[group_name] = group_members
        return radio_group_members, radio_member_to_group

    def _is_round_checkbutton(self, fld: ET.Element) -> bool:
        # look for a descendant <checkButton> and read its shape
        for d in fld.iter():
            if tag_name(d.tag) == "checkButton":
                shape = (d.attrib.get("shape") or "").lower()
                return shape in {"round", "circle"}
        return False

    def _iter_scripts_in(self, container: ET.Element) -> List[str]:
        out: List[str] = []
        for s in container.iter():
            if tag_name(s.tag) == "script":
                txt = (s.text or "").strip()
                if txt:
                    out.append(txt)
        return out


_UNCHECK_RE = re.compile(r"\b([A-Za-z_]\w*)\s*\.rawValue\s*=\s*0\b")


def _collect_uncheck_targets(script_text: str) -> Set[str]:
    return set(_UNCHECK_RE.findall(script_text or ""))
