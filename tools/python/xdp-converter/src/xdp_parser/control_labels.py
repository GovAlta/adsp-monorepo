import re
from xml.etree import ElementTree as ET


class ControlLabels:

    def __init__(self, container_node: ET.Element):
        self.mapping = {}
        self.controls_by_name = _control_index_by_name(container_node)
        self.labels = self._find_control_labels(container_node)

    def get(self, target):
        return self.labels.get(target)

    def getAnnotation(self, key: str) -> str:
        """Fetch help message for a control name."""
        return self.labels.get(key)

    def hasAnnotation(self, key: str) -> bool:
        """Check if a help message exists for a control name."""
        return key in self.labels

    def _find_control_labels(self, container_node):
        """
        Build { control_name: label } for every visible <field>/<exclGroup> under container_node.
        Priority: traversal → inline caption → control name.
        """

        # 1) Traversal-based labels (strongest)
        # Scan any node under container that has <traversal><traverse ref="...">
        target, label = self._find_traversal_hints(container_node)
        if label:
            self.mapping[target] = label

        # 2) Inline caption fallback
        for name, node in self.controls_by_name.items():
            if name in self.mapping:
                continue
            cap = inline_caption(node)
            if cap:
                self.mapping[name] = cap

        # 3) Control-name fallback
        for name in self.controls_by_name.keys():
            if name in self.mapping and self.mapping[name].strip():
                continue
            self.mapping[name] = _control_name(name)

        return self.mapping

    def _find_traversal_hints(self, container_node):
        for container in container_node.iter():
            traversal = container.find("{*}traversal")
            if traversal is None:
                continue

            # candidate label text must be non-empty
            label_txt = _label_text_from_node(container)
            if not label_txt:
                continue

            for traverse in traversal.findall("{*}traverse"):
                ref = (traverse.attrib.get("ref") or "").strip()
                target_name = _last_segment_name_from_ref(ref)
                if not target_name:
                    continue
                target = self.controls_by_name.get(target_name)
                if not target:
                    continue  # traverse might point outside this container

                # Keep the longest non-empty label if duplicates
                prev = self.mapping.get(target_name, "")
                if len(label_txt) > len(prev):
                    return target_name, label_txt

        return None, None


def inline_caption(node):
    # Works for <field> and often for <exclGroup>
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


def _control_name(name):
    # strip common UI/control prefixes
    raw = name or ""
    # remove leading known prefixes once (case-insensitive)
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
    low = raw.lower()
    for p in prefixes:
        if low.startswith(p):
            raw = raw[len(p) :]
            break

    # remove common bracketed indices/suffixes e.g. foo[0]
    raw = re.sub(r"\[\d+\]$", "", raw)

    # split camelCase and snake/kebab
    words = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", raw)
    words = re.sub(r"[_\-]+", " ", words)

    # tidy spaces & title-case
    label = re.sub(r"\s+", " ", words).strip()
    # keep acronyms as-is-ish: title() will lowercase them, so lightly fix common ones if you want
    return label.title()


def _label_text_from_node(node):
    # For <draw>/<text> etc. Prefer value/text; fallback to direct <text>; fallback to @name
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


def _all_controls(container):
    # enumerate visible fields and exclGroups under container (depth-first)
    for element in container.iter():
        if element.tag in {"field", "exclgroup"}:
            name = element.attrib.get("name", "")
            if name:
                yield element


def _control_index_by_name(container):
    idx = {}
    for cntrl in _all_controls(container):
        nm = cntrl.attrib.get("name")
        if nm and nm not in idx:
            idx[nm] = cntrl
    return idx


def _last_segment_name_from_ref(ref):
    if not ref:
        return ""
    seg = ref.split(".")[-1]
    return re.sub(r"\[\d+\]$", "", seg)
