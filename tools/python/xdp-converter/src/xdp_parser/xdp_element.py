from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Any

from importlib.resources.readers import remove_duplicates  # your existing import

from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_utils import compute_full_xdp_path


class XdpElement(ABC):
    def __init__(self, xdp, labels=None, context: ParseContext = None):
        self.xdp_element = xdp
        self.labels = labels
        self.context = context or {}
        self.parent_map = context.get("parent_map", {}) if context else {}
        self.geometry: XdpGeometry = XdpGeometry.resolve(xdp, self.parent_map)
        self.presence = xdp.get("presence", "").strip().lower()

    def get_full_path(self) -> str:
        return compute_full_xdp_path(self.xdp_element, self.parent_map)

    @property
    def full_path(self) -> str:
        """Cached version for quick repeated access."""
        if not hasattr(self, "_full_path_cache"):
            self._full_path_cache = self.get_full_path()
        return self._full_path_cache

    @property
    def x(self):
        return self.geometry.x

    @property
    def y(self):
        return self.geometry.y

    @property
    def w(self):
        return self.geometry.w

    @property
    def h(self):
        return self.geometry.h

    # Element's bounding box
    def bbox(self):
        """(x1, y1, x2, y2) or None if insufficient geometry."""
        if self.x is None or self.y is None or self.w is None or self.h is None:
            return None
        return (self.x, self.y, self.x + self.w, self.y + self.h)

    # Center point of the element
    def center(self):
        b = self.bbox()
        if not b:
            return None
        x1, y1, x2, y2 = b
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    # Check if a point is within the bounding box, with tolerance
    def bbox_contains(self, pt, tol=0.5):
        """pt=(cx,cy). tol in mm."""
        b = self.bbox()
        if not b or not pt:
            return False
        x1, y1, x2, y2 = b
        cx, cy = pt
        return (x1 - tol) <= cx <= (x2 + tol) and (y1 - tol) <= cy <= (y2 + tol)

    def iter_descendants_for_bbox(self):
        # Default: no descendants
        return []

    def visual_bbox(self):
        """
        Prefer explicit bbox; otherwise derive bbox from descendants.
        Returns (x1, y1, x2, y2) or None.
        """
        b = self.bbox()
        if b:
            return b

        kids = list(self.iter_descendants_for_bbox())
        if not kids:
            return None

        boxes = []
        for k in kids:
            kb = k.bbox()
            if kb:
                boxes.append(kb)

        if not boxes:
            return None

        x1 = min(bb[0] for bb in boxes)
        y1 = min(bb[1] for bb in boxes)
        x2 = max(bb[2] for bb in boxes)
        y2 = max(bb[3] for bb in boxes)
        return (x1, y1, x2, y2)

    def visual_height(self) -> float:
        vb = self.visual_bbox()
        if not vb:
            return 0.0
        _, y1, _, y2 = vb
        return max(0.0, float(y2 - y1))

    def effective_height(self) -> float:
        if self.h is not None:
            return float(self.h)
        return float(self.visual_height())

    @abstractmethod
    def to_form_element(self) -> FormElement:
        pass

    def get_type(self):
        return "string"

    def is_control(self):
        return False  # default

    def is_help_text(self):
        return False  # default

    def get_name(self):
        return self.xdp_element.get("name", "")

    def get_label(self):
        label = None
        if self.labels:
            label = self.labels.get(self.get_name())
        return label

    def get_enumeration_values(self):
        """
        Return de-duped human-readable choices from <items><text>...</text></items>,
        ignoring any <items> blocks with presence="hidden".
        """
        enum_values = []

        # Find all <items> under this field (assumes namespaces stripped)
        for items_el in self.xdp_element.findall(".//items"):
            presence = (items_el.attrib.get("presence") or "").strip().lower()
            if presence == "hidden":
                continue  # skip saved-value list

            # Collect the human-readable labels
            for text_el in items_el.findall("./text"):
                txt = "".join(text_el.itertext()).strip()
                if txt:
                    enum_values.append(txt)

        if enum_values:
            # keep your existing stable-order de-dupe
            return [str(v) for v in remove_duplicates(enum_values)]
        return None

    def get_format(self):
        isDate = matches_prefix(self.get_name(), "dte")
        if isDate:
            return "date"
        return None


def matches_prefix(candidate: str, prefix: str) -> bool:
    if not candidate or not prefix:
        return False
    if len(prefix) > len(candidate):
        return False
    return candidate[: len(prefix)] == prefix


def get_caption_text(xdp_element):
    caption_value_elem = xdp_element.find(".//caption/value")

    if caption_value_elem is not None:
        # Get all text content from the value and its children
        caption_text = "".join(caption_value_elem.itertext()).strip()
        if caption_text:
            return caption_text

    return None


from dataclasses import dataclass
from typing import Optional, Any


@dataclass
class XdpGeometry:
    """
    Simple holder for XDP layout and coordinates.
    All numeric values are in millimetres where possible.
    """

    x: Optional[float] = None
    y: Optional[float] = None
    w: Optional[float] = None
    h: Optional[float] = None
    layout: Optional[str] = None

    @classmethod
    def resolve(cls, node, parent_map) -> "XdpGeometry":
        """
        Compute absolute coordinates by accumulating relative offsets up the parent chain.
        XFA children typically use x/y relative to their parent subform/container.
        """
        curr = node
        acc_x = 0.0
        acc_y = 0.0
        saw_any = False

        # width/height/layout should come from the node itself (not from parents)
        w = cls._parse_mm(node.get("w"))
        h = cls._parse_mm(node.get("h"))
        layout = node.get("layout")

        # Walk from node up to root accumulating offsets
        while curr is not None:
            raw_x = curr.get("x")
            raw_y = curr.get("y")

            if raw_x is not None or raw_y is not None:
                saw_any = True
                # missing x or y treated as 0 offset
                dx = cls._parse_mm(raw_x) or 0.0
                dy = cls._parse_mm(raw_y) or 0.0
                acc_x += dx
                acc_y += dy

            curr = parent_map.get(curr)

        if not saw_any:
            return cls(x=None, y=None, w=w, h=h, layout=layout)

        return cls(x=acc_x, y=acc_y, w=w, h=h, layout=layout)

    @staticmethod
    def _parse_mm(raw: Any) -> Optional[float]:
        if raw is None:
            return None
        s = str(raw).strip()
        if not s:
            return None
        if s.endswith("mm"):
            s = s[:-2]
        try:
            return float(s)
        except ValueError:
            return None

    @classmethod
    def from_xdp(cls, xdp) -> "XdpGeometry":
        """
        Build geometry directly from an XDP element's attributes.
        Missing attributes stay as None so we can detect them.
        """
        return cls(
            x=cls._parse_mm(xdp.get("x")),
            y=cls._parse_mm(xdp.get("y")),
            w=cls._parse_mm(xdp.get("w")),
            h=cls._parse_mm(xdp.get("h")),
            layout=xdp.get("layout"),  # ← 🔥 ADDED
        )

    @classmethod
    def from_children(cls, children, fallback=None):
        xs, ys = [], []

        for child in children:
            g = getattr(child, "geometry", None)
            if not g:
                continue
            if g.x is not None:
                xs.append(g.x)
            if g.y is not None:
                ys.append(g.y)

        x = min(xs) if xs else (fallback.x if fallback else None)
        y = min(ys) if ys else (fallback.y if fallback else None)

        return cls(
            x=x,
            y=y,
            w=fallback.w if fallback else None,
            h=fallback.h if fallback else None,
            layout=fallback.layout if fallback else None,
        )
