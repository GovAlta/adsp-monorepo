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
        Adobe-style coordinate resolution:
        Walk upward until we find a coordinate-bearing ancestor.
        """
        curr = node

        if node not in parent_map:
            print(
                "🔥 node not in parent_map:",
                "tag=",
                node.tag,
                "name=",
                node.get("name"),
            )
            # optional: print node attribs for sanity
            print("attribs:", node.attrib)

        while curr is not None:
            raw_x = curr.get("x")
            raw_y = curr.get("y")
            if raw_x is not None and raw_y is not None:
                return cls(
                    x=cls._parse_mm(raw_x),
                    y=cls._parse_mm(raw_y),
                    w=cls._parse_mm(curr.get("w")),
                    h=cls._parse_mm(curr.get("h")),
                    layout=curr.get("layout"),
                )
            curr = parent_map.get(curr)

        # No coordinates found → bottom of list, but stable
        return cls(
            x=None,
            y=None,
            w=None,
            h=None,
            layout=node.get("layout"),
        )

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
