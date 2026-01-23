from dataclasses import dataclass
from typing import List, Tuple
from xdp_parser.control_labels import ControlLabels
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_utils import DisplayText

debug = False


@dataclass(frozen=True)
class ControlBox:
    control: XdpElement
    bbox: Tuple[float, float, float, float]


class ControlDescriptionExtractor:
    """
    Extract short help-text draws (e.g., "(lb./ft.)") as
    a description for an overlapping's control's label.
    """

    def __init__(
        self,
        max_description_chars: int = 20,
        min_intersection_area: float = 0.01,  # mm^2
    ):
        self.max_description_chars = max_description_chars
        self.min_intersection_area = min_intersection_area

    def extract(
        self,
        elements: List[XdpElement],
        control_labels: ControlLabels,
    ) -> List[XdpElement]:
        """
        Scan the given elements for short help-text draws that
        overlap controls, and extract them as descriptions for those controls' labels.

        Modifies:
            control_labels: updates labels with extracted descriptions.

        Returns:
            elements: removes extracted help-text elements.
        """

        # Candidate controls (with usable bounding-boxes)
        controls: list[ControlBox] = []
        for e in elements:
            if not e.is_control():
                continue

            bb = e.visual_bbox()
            if bb is None:
                continue

            controls.append(ControlBox(control=e, bbox=bb))

        if not controls:
            return elements[:]  # nothing to do

        out: List = []

        for e in elements:
            # We only care about draw-style help text
            if e.is_help_text() and not e.is_help_icon():
                helpContent: XdpHelpText = e
                description = (helpContent.help_text() or "").strip()
                if not description:
                    out.append(e)
                    continue

                # Keep headers / long help in the normal flow
                if len(description) > self.max_description_chars:
                    out.append(e)
                    continue

                e_bb = e.visual_bbox()
                if e_bb is None:
                    out.append(e)
                    continue

                target = self._best_overlap(e_bb, controls, self.min_intersection_area)
                if target is None:
                    out.append(e)
                    continue

                target_name = target.get_name()

                existing = control_labels.get(target_name) or DisplayText("", "")
                merged = DisplayText(
                    label=existing.label,
                    description=description,
                )
                control_labels.set(target_name, merged)

                if debug:
                    print(f"[EXTRACT DESCRIPTION] '{description}' -> {target_name}")

                # IMPORTANT: omit the description element so it doesn't emit as HelpContent
                continue

            out.append(e)

        return out

    @staticmethod
    def _best_overlap(
        e_bbox: tuple[float, float, float, float],
        controls: list[ControlBox],
        min_intersection_area: float,
    ):
        best: ControlBox | None = None
        best_area = 0.0

        for cb in controls:
            area = ControlDescriptionExtractor._intersection_area(e_bbox, cb.bbox)
            if area > best_area:
                best_area = area
                best = cb

        return best.control if best_area >= min_intersection_area else None

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
