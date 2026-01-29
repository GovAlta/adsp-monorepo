from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Set

from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_help_control_pair import XdpHelpControlPair


@dataclass(frozen=True)
class _IndexedCandidate:
    idx: int
    element: "XdpElement"
    bb: tuple[float, float, float, float]


class HelpPairer:
    def __init__(
        self,
        debug: bool = False,
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
        candidates = self._build_candidates(elements)
        if not candidates:
            return elements[:]

        # Pass 1: plan pairings (help_idx -> target_idx)
        plan = self._plan_pairs(elements, candidates)

        # Pass 2: emit
        return self._emit_from_plan(elements, plan, context)

    # ---------------- pass 1 ----------------
    def _build_candidates(
        self, elements: List["XdpElement"]
    ) -> list[_IndexedCandidate]:
        candidates: list[_IndexedCandidate] = []
        for idx, e in enumerate(elements):
            if not self._is_pair_target(e):
                continue
            bb = e.extended_footprint()
            if bb is None:
                continue
            candidates.append(_IndexedCandidate(idx=idx, element=e, bb=bb))
        return candidates

    def _plan_pairs(
        self,
        elements: List["XdpElement"],
        candidates: list[_IndexedCandidate],
    ) -> Dict[int, int]:
        """
        Returns mapping: help_idx -> target_idx.
        Rule: first help icon in element order wins any contested target.
        """
        target_taken: Set[int] = set()
        plan: Dict[int, int] = {}

        for help_idx, e in enumerate(elements):
            if not e.is_help_icon():
                continue

            hb = e.extended_footprint()
            if hb is None:
                continue

            best = self._best_overlap_target(hb, candidates)
            if best is None:
                continue

            target_idx, target = best

            # can't pair to itself; and only one help icon may claim a target
            if target_idx == help_idx or target_idx in target_taken:
                continue

            plan[help_idx] = target_idx
            target_taken.add(target_idx)

            if self.debug:
                print(
                    f"[PAIR:plan] help={e.get_name()}(idx={help_idx}) -> "
                    f"target={target.get_name()}(idx={target_idx})"
                )

        return plan

    # ---------------- pass 2 ----------------
    def _emit_from_plan(
        self,
        elements: List["XdpElement"],
        plan: Dict[int, int],
        context,
    ) -> List["XdpElement"]:
        paired_targets: Set[int] = set(plan.values())
        out: list["XdpElement"] = []

        for idx, e in enumerate(elements):
            # If this is a help icon with a plan, emit the pair (and do NOT emit the icon separately)
            target_idx = plan.get(idx)
            if target_idx is not None:
                target = elements[target_idx]
                out.append(XdpHelpControlPair(e, target, context=context))
                continue

            # If this element is a target of some help icon, suppress it
            if idx in paired_targets:
                continue

            # Otherwise emit normally
            out.append(e)

        return out

    # ---------------- eligibility ----------------
    def _is_pair_target(self, e: "XdpElement") -> bool:
        return e.is_control() or e.is_header()

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

            # Optional deterministic tie-break: prefer earlier target index
            if score > best_score or (
                score == best_score and best_idx is not None and c.idx < best_idx
            ):
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
