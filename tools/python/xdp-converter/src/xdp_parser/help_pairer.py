from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_help_control_pair import XdpHelpControlPair
from dataclasses import dataclass
from typing import List, Optional, Tuple


debug = True


@dataclass(frozen=True)
class _IndexedCandidate:
    idx: int
    element: "XdpElement"
    bb: tuple[float, float, float, float]


class HelpPairer:
    def __init__(
        self,
        debug=False,
        min_intersection_area: float = 0.5,  # mm^2 (tune)
        max_center_distance_mm: float = 60.0,  # safety clamp (tune)
        require_same_row_overlap_frac: float = 0.30,
    ):
        self.min_intersection_area = min_intersection_area
        self.max_center_distance_mm = max_center_distance_mm
        self.require_same_row_overlap_frac = require_same_row_overlap_frac
        self.debug = debug

    def consolidate_help_pairs(
        self,
        elements: List["XdpElement"],
        context,
    ) -> List["XdpElement"]:

        # Precompute eligible targets with their *indices* in the list
        candidates: list[_IndexedCandidate] = []
        for idx, e in enumerate(elements):
            if not self._is_pair_target(e):
                continue
            bb = e.extended_footprint()
            if bb is None:
                continue
            candidates.append(_IndexedCandidate(idx=idx, element=e, bb=bb))

        if not candidates:
            return elements[:]

        consumed_indices: set[int] = set()
        out: list["XdpElement"] = []

        for i, e in enumerate(elements):
            if i in consumed_indices:
                continue

            if not e.is_help_icon():
                out.append(e)
                continue

            hb = e.extended_footprint()
            if hb is None:
                out.append(e)
                continue

            best = self._best_overlap_target(hb, candidates)
            if best is None:
                out.append(e)
                continue

            target_idx, target = best

            # If the target is already consumed (paired by an earlier help icon),
            # treat this help as unpaired.
            if target_idx in consumed_indices or target_idx == i:
                out.append(e)
                continue

            # Consume the target so it doesn't get emitted later
            consumed_indices.add(target_idx)

            pair = XdpHelpControlPair(e, target, context=context)
            out.append(pair)

            if self.debug:
                print(
                    f"[PAIR:overlap] help={e.get_name()} -> target={target.get_name()}"
                )

        return out

    # ---------------- eligibility ----------------
    def _is_pair_target(self, e: "XdpElement") -> bool:
        # Controls only for now (you can add groups/headers later)
        return e.is_control()

    # ---------------- scoring ----------------
    def _best_overlap_target(
        self,
        hb: tuple[float, float, float, float],
        candidates: list[_IndexedCandidate],
    ) -> Optional[Tuple[int, "XdpElement"]]:

        hx1, hy1, hx2, hy2 = hb
        hcx, hcy = (hx1 + hx2) / 2.0, (hy1 + hy2) / 2.0
        hh = max(hy2 - hy1, 0.0001)

        best_idx = None
        best_el = None
        best_score = 0.0

        for c in candidates:
            area = self._intersection_area(hb, c.bb)
            if area < self.min_intersection_area:
                continue

            cx1, cy1, cx2, cy2 = c.bb
            overlap_y = min(hy2, cy2) - max(hy1, cy1)
            if overlap_y <= 0.0:
                continue

            ch = max(cy2 - cy1, 0.0001)
            overlap_frac = overlap_y / min(hh, ch)
            if overlap_frac < self.require_same_row_overlap_frac:
                continue

            ccx, ccy = (cx1 + cx2) / 2.0, (cy1 + cy2) / 2.0
            dist = ((hcx - ccx) ** 2 + (hcy - ccy) ** 2) ** 0.5
            if dist > self.max_center_distance_mm:
                continue

            score = area * 1000.0 + (1.0 / (1.0 + dist)) * 10.0 + overlap_frac * 5.0

            if score > best_score:
                best_score = score
                best_idx = c.idx
                best_el = c.element

        if best_el is None:
            return None
        return best_idx, best_el

    @staticmethod
    def _intersection_area(a, b) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        ix1 = max(ax1, bx1)
        iy1 = max(ay1, by1)
        ix2 = min(ax2, bx2)
        iy2 = min(ay2, by2)
        if ix2 <= ix1 or iy2 <= iy1:
            return 0.0
        return (ix2 - ix1) * (iy2 - iy1)
