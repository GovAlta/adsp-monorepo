import xml.etree.ElementTree as ET
from typing import Dict, List, Tuple, Set
import re

from rule_generator.gather_label_text import gather_label_text
from xdp_parser.xdp_utils import tag_name


class ParseSelectors:
    def __init__(self, root: ET.Element, debug: bool = False):
        self.root = root
        self.debug = debug

    # def build_radio_btn_groups(
    #     self,
    # ) -> Tuple[Dict[str, Dict[str, str]], Dict[str, str]]:
    #     """
    #     Return:
    #     group_to_button_map: { btn_group_name: { btn: label } }
    #     button_to_group_map: { btn: btn_group_name }
    #     Combines true <exclGroup> groups and heuristic radio-like clusters.
    #     """
    #     group_to_button_map = self._find_excl_groups()

    #     # add heuristic clusters where no explicit exclGroup is present for that container name
    #     radio_clusters = self._find_radio_like_clusters()
    #     for btn_group_name, button in radio_clusters.items():
    #         group_to_button_map.setdefault(btn_group_name, button)

    #     button_to_group_map: Dict[str, str] = {}
    #     for btn_group_name, button in group_to_button_map.items():
    #         for btn in button:
    #             button_to_group_map[btn] = btn_group_name
    #     return group_to_button_map, button_to_group_map

    def _find_excl_groups(self) -> Dict[str, Dict[str, str]]:
        """
        Return: { group_name: { member_field_name: label } } using <exclGroup>.
        """
        out: Dict[str, Dict[str, str]] = {}
        for ex in self.root.iter():
            if tag_name(ex.tag) != "exclGroup":
                continue
            gname = ex.attrib.get("name") or "radioGroup"
            group: Dict[str, str] = {}
            # iterate descendants; pick <field> elements
            for fld in ex.iter():
                if tag_name(fld.tag) != "field":
                    continue
                fname = fld.attrib.get("name")
                if not fname:
                    continue
                label = gather_label_text(fld) or fname
                group[fname] = label
            # keep only if there are at least two options
            if len(group) >= 2:
                out[gname] = group
        return out

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

    def build_choice_groups(self, root: ET.Element):
        group_to_label: dict[str, dict[str, str]] = {}

        # 1) explicit exclGroup
        for ex in root.iter():
            if tag_name(ex.tag) != "exclGroup":
                continue
            gname = ex.attrib.get("name") or "RadioGroup"
            group: dict[str, str] = {}
            for fld in ex.iter():
                if tag_name(fld.tag) != "field":
                    continue
                if not self._looks_like_option_field(fld):
                    continue
                fname = fld.attrib.get("name")
                if not fname:
                    continue
                label = gather_label_text(fld, search_root=root) or fname
                group[fname] = label
            if len(group) >= 2:
                group_to_label[gname] = group

        # 2) heuristic clusters by subform
        for sub in root.iter():
            if tag_name(sub.tag) != "subform":
                continue
            # collect option-like fields directly under/within this subform
            fields = [
                f
                for f in sub.iter()
                if tag_name(f.tag) == "field" and self._looks_like_option_field(f)
            ]
            if len(fields) < 2:
                continue

            # radio-like if at least two are round OR scripts uncheck others
            round_count = sum(1 for f in fields if self._is_round_checkbutton(f))
            scripts_text = "\n".join(self._iter_scripts_in(sub))
            uncheck_targets = _collect_uncheck_targets(scripts_text)
            names = [f.attrib.get("name") for f in fields if f.attrib.get("name")]
            radioish = round_count >= 2 or (
                len(set(names).intersection(uncheck_targets)) >= 1
            )

            if not radioish:
                continue

            gname = sub.attrib.get("name") or "RadioGroup"
            if gname in group_to_label:
                continue  # prefer explicit

            grp: dict[str, str] = {}
            for f in fields:
                fname = f.attrib.get("name")
                if not fname:
                    continue
                lbl = gather_label_text(f, search_root=root) or fname
                grp[fname] = lbl
            if len(grp) >= 2:
                group_to_label[gname] = grp

        # create reverse map
        member_to_group: dict[str, str] = {}
        for g, mapping in group_to_label.items():
            for member in mapping:
                member_to_group[member] = g

        if self.debug:
            print(
                "[radio] groups:",
                {g: list(m.keys()) for g, m in group_to_label.items()},
            )
            print(
                "[radio] member_to_group keys:",
                sorted(member_to_group.keys())[:20],
                "…",
            )
        return group_to_label, member_to_group

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
