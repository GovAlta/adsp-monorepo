import re
from xml.etree import ElementTree as ET


class ControlLabels:
    def __init__(self, container_node: ET.Element, context):
        self.mapping: dict[str, str] = {}
        self.context = context
        self.controls_by_name = _control_index_by_name(
            container_node, context.parent_map
        )
        self.labels = self._find_control_labels(container_node)

    def get(self, target: str) -> str | None:
        return self.labels.get(target)

    def _find_control_labels(self, container_node: ET.Element) -> dict[str, str]:
        """
        Build { control_name: label } for every visible <field>/<exclGroup> under container_node.

        Priority:
        1. traversal-hints
        2. inline caption (including exData help captions)
        3. preceding <draw> label
        4. cleaned control name (fallback)
        """

        # 1) Traversal-based labels (strongest)
        target, label = self._find_traversal_hints(container_node)
        if target and label:
            self.mapping[target] = label

        # 2) Inline caption fallback
        for name, node in self.controls_by_name.items():
            if name in self.mapping:
                continue
            caption = inline_caption(node)
            if caption:
                self.mapping[name] = caption

        # 3) Preceding-draw label fallback
        for name, node in self.controls_by_name.items():
            if name in self.mapping and self.mapping[name].strip():
                continue
            draw_lbl = self._preceding_draw_label(node)
            if draw_lbl:
                self.mapping[name] = draw_lbl

        # 4) Control-name fallback
        for name in self.controls_by_name.keys():
            if name in self.mapping and self.mapping[name].strip():
                continue
            self.mapping[name] = _control_name(name)

        # DEBUG: show labels for radio groups and friends
        interesting_keys = [
            "rbApplicant",
            "rbCoverYes_No",
            "rbStatusYes_No",
            "rbCanadaYes_No",
        ]
        print("[CTRL] Final label mapping for radios:")
        for key in interesting_keys:
            print(f"  [CTRL] {key!r} -> {self.mapping.get(key)!r}")
        print()

        return self.mapping

    def _find_traversal_hints(
        self, container_node: ET.Element
    ) -> tuple[str | None, str | None]:
        """
        Handle Adobe traversal-based labelling:
        <traversal>
          <traverse ref="...some.field.name..."/>
        </traversal>
        """
        for element in container_node.iter():
            traversal = element.find("{*}traversal")
            if traversal is None:
                continue

            label_txt = _label_text_from_node(element)
            if not label_txt:
                continue

            for traverse in traversal.findall("{*}traverse"):
                ref = (traverse.attrib.get("ref") or "").strip()
                target_name = _last_segment_name_from_ref(ref)
                if not target_name:
                    continue

                target = self.controls_by_name.get(target_name)
                if not target:
                    continue  # traverse may point outside this container

                prev = self.mapping.get(target_name, "")
                if len(label_txt) > len(prev):
                    return target_name, label_txt

        return None, None

    # ------------------------------------------------------------
    # SIBLING DRAW LABELS (NEEDS PARENT MAP)
    # ------------------------------------------------------------
    def _preceding_draw_label(self, node):
        """
        Finds the closest preceding <draw> sibling WITHIN THE SAME PARENT,
        using parent_map (since ElementTree lacks getparent()).
        """
        name = node.attrib.get("name", "")
        print(f"[CTRL] _preceding_draw_label for node={name!r}")

        parent = self.context.parent_map.get(node)
        if parent is None:
            print(f"[CTRL]   no parent in parent_map for {name!r}")
            return None

        children = list(parent)
        try:
            index = children.index(node)
        except ValueError:
            print(f"[CTRL]   node {name!r} not found among parent's children")
            return None

        # scan backwards for a <draw> that looks like a label
        for prev in reversed(children[:index]):
            tag = (
                prev.tag.split("}", 1)[-1].lower()
                if "}" in prev.tag
                else prev.tag.lower()
            )
            if tag == "draw":
                nm = prev.get("name", "")
                txt = _label_text_from_node(prev)
                print(f"[CTRL]   found preceding <draw> name={nm!r} text={txt!r}")
                nm_low = nm.lower()
                if nm_low.startswith("lbl") or nm_low.startswith("label"):
                    if txt and txt.strip():
                        print(
                            f"[CTRL]   USING preceding-draw label {txt!r} for {name!r}"
                        )
                        return txt.strip()

        print(f"[CTRL]   no usable preceding <draw> for {name!r}")
        return None


# ----------------------------------------------------------------
# LOWER-LEVEL LABEL UTILITIES
# ----------------------------------------------------------------


def inline_caption(node):
    t = node.find(".//{*}caption/{*}value/{*}text")
    if t is not None and (t.text or "").strip():
        return t.text.strip()

    caption = node.find(".//caption/value")
    if caption:
        exdata = caption.find("exData")
        if exdata is not None:
            raw_text = "".join(exdata.itertext())
            return re.sub(r"\s+", " ", raw_text).strip()

    return ""


prefixes = (
    "lbl",
    "label",
    "txt",
    "cbo",
    "drp",
    "num",
    "chk",
    "rb",
    "rad",
    "fld",
    "ctl",
    "ctrl",
    "lst",
    "ddl",
)


def _control_name(name: str | None) -> str:
    """
    Turn raw control name into something displayable:

      - Strip standard prefixes (lbl, txt, rb, chk, etc.)
      - Strip [0], [1] style indices
      - Split camelCase / snake_case / kebab-case
      - Special-case trailing Yes/No patterns like "CoverYes_No"
    """
    raw = name or ""
    low = raw.lower()

    # strip one known prefix
    for p in prefixes:
        if low.startswith(p):
            raw = raw[len(p) :]
            break

    # strip common Yes/No suffixes, e.g. "CoverYes_No", "CoverYesNo"
    m = re.match(r"^(.*?)(yes[_]?no)$", raw, re.IGNORECASE)
    if m:
        raw = m.group(1)

    # remove trailing [index] like foo[0]
    raw = re.sub(r"\[\d+\]$", "", raw)

    # split camelCase and snake/kebab into words
    words = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", raw)
    words = re.sub(r"[_\-]+", " ", words)

    label = re.sub(r"\s+", " ", words).strip()

    # Preserve pure acronyms like AAHB, SIN, CRA
    if re.fullmatch(r"[A-Z0-9]+", label) and len(label) > 1:
        return label

    return label.title()


def _label_text_from_node(node):
    label = node.find(".//{*}value/{*}text")
    if label is not None and (label.text or "").strip():
        return label.text.strip()

    t = node.find(".//{*}text")
    if t is not None and (t.text or "").strip():
        return t.text.strip()

    caption = node.find(".//caption/value")
    if caption:
        exdata = caption.find("exData")
        if exdata is not None:
            raw_text = "".join(exdata.itertext())
            return re.sub(r"\s+", " ", raw_text).strip()

    return node.attrib.get("name", "").strip()


def _all_controls(container, parent_map=None):
    for element in container.iter():
        tag = element.tag.split("}", 1)[-1].lower()

        # case 1: exclGroup itself is a control
        if tag == "exclgroup":
            name = element.attrib.get("name")
            if name:
                yield element
            continue

        # case 2: skip the *radio items* inside an exclGroup, but NOT the group
        if parent_map:
            parent = parent_map.get(element)
            if parent is not None:
                ptag = parent.tag.split("}", 1)[-1].lower()
                if ptag == "exclgroup":
                    # skip child items
                    continue

        # case 3: fields
        if tag == "field":
            name = element.attrib.get("name")
            if name:
                yield element


def _control_index_by_name(container, parent_map):
    idx = {}
    for element in _all_controls(container, parent_map):
        name = element.attrib.get("name")
        if name and name not in idx:
            idx[name] = element
    print("[CTRL] Controls discovered:")
    for k, v in idx.items():
        print(
            "   ",
            k,
            "tag=",
            v.tag,
            "parent=",
            parent_map.get(v).tag if parent_map.get(v) else None,
        )
    return idx


def _last_segment_name_from_ref(ref):
    if not ref:
        return ""
    seg = ref.split(".")[-1]
    return re.sub(r"\[\d+\]$", "", seg)
