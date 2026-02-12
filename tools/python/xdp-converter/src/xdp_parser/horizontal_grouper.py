import xml.etree.ElementTree as ET
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_row import XdpRow


class HorizontalGrouper:

    def __init__(
        self,
        y_fuzz_mm=3.0,
        max_gap_mm=35.0,
    ):
        self.y_fuzz_mm = y_fuzz_mm
        self.max_gap_mm = max_gap_mm

    def consolidate_rows(
        self,
        container: ET.Element,
        elements: list[XdpElement],
        context: ParseContext,
        debug=False,
    ) -> list[XdpElement]:
        out = []
        row = []
        row_y = None
        prev = None

        def flush_row():
            nonlocal row, prev, row_y
            if not row:
                return
            if len(row) >= 2:
                out.append(XdpRow(container, row, context))
            else:
                out.append(row[0])
            row = []
            prev = None
            row_y = None

        for e in elements:

            # Only controls can be row members; non-controls break the flow and get emitted as-is.
            # This also means that containers that aren't explicitly marked as flow (e.g. subforms)
            # won't get rowified, which is probably good since they often have more complex
            # layouts that don't fit well into a simple row model.
            if not e.is_control():
                if debug:
                    print(f" {e.get_name()} is not a control, breaking flow")
                flush_row()
                out.append(e)
                continue

            # group container's elements, but don't consider them to be part of a row themselves.
            if e.is_container() and e.has_children():
                grouped_children = self.consolidate_rows(
                    e.xdp_element, e.get_children(), context
                )
                e.set_children(grouped_children)
                flush_row()
                out.append(e)
                continue

            bb = e.extended_footprint()
            if debug:
                print(f"    {e.get_name()} footprint: {bb}")
            if bb is None:
                flush_row()
                out.append(e)
                if debug:
                    print(f"    {e.get_name()} has no footprint")
                continue

            my = self.mid_y(e)
            lx = self.left_x(e)

            if not row:
                if debug:
                    print(f"    Starting new row with {e.get_name()} at y={my}")
                row = [e]
                row_y = my
                prev = e
                continue

            # check row membership
            ok_y = (
                my is not None
                and row_y is not None
                and abs(my - row_y) <= self.y_fuzz_mm
            )

            prev_rx = self.right_x(prev)
            ok_gap = True
            if prev_rx is not None and lx is not None:
                ok_gap = (lx - prev_rx) <= self.max_gap_mm

            ok_lr = True
            prev_lx = self.left_x(prev)
            if prev_lx is not None and lx is not None:
                ok_lr = lx >= prev_lx - 1.0  # tiny backtrack tolerance

            if ok_y and ok_gap and ok_lr:
                row.append(e)
                prev = e
            else:
                if debug:
                    print(
                        f"    Flushing row of {len(row)} elements due to new element {e.get_name()} at y={my} (ok_y={ok_y}, ok_gap={ok_gap}, ok_lr={ok_lr})"
                    )
                flush_row()
                row = [e]
                row_y = my
                prev = e

        flush_row()
        return out

    @staticmethod
    def mid_y(e: XdpElement):
        bb = e.extended_footprint()
        if not bb:
            return None
        _, y1, _, y2 = bb
        return (y1 + y2) / 2.0

    @staticmethod
    def left_x(e: XdpElement):
        bb = e.extended_footprint()
        if not bb:
            return None
        return bb[0]

    @staticmethod
    def right_x(e: XdpElement):
        bb = e.extended_footprint()
        if not bb:
            return None
        return bb[2]
