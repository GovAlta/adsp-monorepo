import re
from xml.etree import ElementTree as ET
from xdp_parser.parsing_helpers import split_label_and_help
from xdp_parser.xdp_utils import Labeling


class ControlLabels:
    """
    Build a mapping { control_name: label_text } for all visible controls in a container.

    Priority:
      1) Inline caption (field only; exclGroup captions ignored)
      2) Preceding <draw> sibling label (same parent; stop if another control encountered)
      3) Fallback to cleaned control name (optional)
    """

    def __init__(
        self,
        container_node: ET.Element,
        context,
    ):
        """
        Args:
            container_node: subform or container element to scan.
            context: must expose `parent_map: dict[ET.Element, ET.Element]`
        """
        self.context = context
        self.parent_map = getattr(context, "parent_map", {}) or {}
        self.debug = True
        self.mapping: dict[str, Labeling] = {}
        self.controls_by_name: dict[str, ET.Element] = _control_index_by_name(
            container_node, self.parent_map
        )
        self.labels: dict[str, Labeling] = self._build_labels(container_node)

    def get(self, target: str) -> Labeling | None:
        val = self.labels.get(target)
        if val is None:
            return None
        if val.label.strip() == "":
            return None
        return val

    # ----------------------------------------------------------------
    # MAIN LABEL BUILD
    # ----------------------------------------------------------------

    def _build_labels(self, container_node: ET.Element) -> dict[str, Labeling]:
        if self.debug:
            print(f"[LABEL] Building labels for: '{container_node.get('name')}'")

        # Inline captions (field only)
        for name, node in self.controls_by_name.items():
            caption = inline_caption(node)
            if caption and caption.strip():
                self.mapping[name] = split_label_and_help(caption)
                if self.debug:
                    print(f"[LABEL] '{name}' <- '{caption.strip()}' (inline caption)")

        # Preceding <draw> sibling label (same parent)
        for name, node in self.controls_by_name.items():
            if name in self.mapping and self.mapping[name].label.strip():
                continue
            draw_lbl = self._preceding_draw_label(node)
            if draw_lbl and draw_lbl.strip():
                self.mapping[name] = split_label_and_help(draw_lbl)
                if self.debug:
                    print(
                        f"[LABEL] '{name}' <- '{draw_lbl.strip()}' (preceding <draw>)"
                    )

        # # 3) Optional fallback: cleaned control name OR leave unlabeled
        # for name in self.controls_by_name.keys():
        #     if name in self.mapping and self.mapping[name].strip():
        #         continue

        # if self.return_none_for_unlabeled:
        #     # Intentionally do not set a label. Caller sees None via get().
        #     if self.debug:
        #         print(f"[LABEL] '{name}' <- None (no label found)")
        #     continue

        # if self.use_name_fallback:
        #     fallback = _control_name(name)
        #     self.mapping[name] = fallback
        #     if self.debug:
        #         print(f"[LABEL] '{name}' <- '{fallback}' (name fallback)")
        # else:
        #     if self.debug:
        #         print(f"[LABEL] '{name}' <- '' (no fallback)")

        return self.mapping

    # ----------------------------------------------------------------
    # PRECEDING DRAW LABELS
    # ----------------------------------------------------------------

    def _preceding_draw_label(self, node: ET.Element) -> str | None:
        """
        Finds the closest preceding <draw> sibling WITHIN THE SAME PARENT
        that looks like a label. Stops if another control is encountered first.

        Heuristics:
          - Only accept <draw> elements with name starting 'lbl' or 'label'
          - Require non-empty text content
        """
        parent = self.parent_map.get(node)
        if parent is None:
            return None

        children = list(parent)
        try:
            idx = children.index(node)
        except ValueError:
            return None

        for prev in reversed(children[:idx]):
            ptag = prev.tag.split("}", 1)[-1].lower()

            # stop if we hit another control (label likely belongs to that control)
            if ptag in {"field", "exclgroup"}:
                break

            if ptag != "draw":
                continue

            nm = (prev.get("name") or "").strip()
            nm_low = nm.lower()
            if not (nm_low.startswith("lbl") or nm_low.startswith("label")):
                continue

            txt = _draw_text(prev)
            if txt:
                return txt

        return None


# ----------------------------------------------------------------
# DRAW TEXT (strict)
# ----------------------------------------------------------------


def _draw_text(draw_node: ET.Element) -> str:
    """
    Extract text from a <draw> node *only* (not from fields).
    This avoids confusing a field's <value> as "label text".

    Handles:
      - <value><text>...</text>
      - fallback <text>...</text> if present
      - exData inside caption/value (less common for draw, but safe)
    """
    # Common: draw/value/text
    t = draw_node.find(".//{*}value/{*}text")
    if t is not None and (t.text or "").strip():
        return t.text.strip()

    # Some draws may have <text> directly
    t2 = draw_node.find(".//{*}text")
    if t2 is not None and (t2.text or "").strip():
        return t2.text.strip()

    # exData fallback if used
    caption = draw_node.find(".//caption/value")
    if caption is not None:
        exdata = caption.find("exData")
        if exdata is not None:
            raw_text = "".join(exdata.itertext())
            raw_text = re.sub(r"\s+", " ", raw_text).strip()
            if raw_text:
                return raw_text

    return ""


# ----------------------------------------------------------------
# LOWER-LEVEL LABEL UTILITIES
# ----------------------------------------------------------------


def inline_caption(node):
    # If this is an exclGroup, ignore child captions entirely.
    tag = node.tag.split("}", 1)[-1].lower()
    if tag == "exclgroup":
        return ""
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
    return idx
