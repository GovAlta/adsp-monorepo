from schema_generator.form_input import FormInput
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import get_field_caption, convert_to_mm


class XdpRadio(XdpElement):
    def __init__(self, xdp, labels, context: ParseContext):
        super().__init__(xdp, labels, context)

    def is_control(self):
        return True

    def footprint(self):
        """
        Radio groups are derived from <exclGroup>, which often has x/y but no w/h.
        In that case, derive a footprint by unioning child <field> footprints.
        """
        # If base geometry is complete, keep the default behavior.
        fp = super().footprint()
        if fp is not None:
            return fp

        # We need at least an anchor position for the group.
        if self.x is None or self.y is None:
            return None

        base_x = float(self.x)
        base_y = float(self.y)

        x1 = None
        y1 = None
        x2 = None
        y2 = None

        # NOTE: .//field finds nested fields too; that’s fine for exclGroup.
        fields = list(self.xdp_element.findall(".//field"))
        if not fields:
            return None

        for f in fields:
            f_fp = self._field_footprint_relative_to_group(
                f, base_x=base_x, base_y=base_y
            )
            if f_fp is None:
                continue

            fx1, fy1, fx2, fy2 = f_fp
            x1 = fx1 if x1 is None else min(x1, fx1)
            y1 = fy1 if y1 is None else min(y1, fy1)
            x2 = fx2 if x2 is None else max(x2, fx2)
            y2 = fy2 if y2 is None else max(y2, fy2)

        if x1 is None or y1 is None or x2 is None or y2 is None:
            return None

        return (x1, y1, x2, y2)

    @staticmethod
    def _field_footprint_relative_to_group(field, *, base_x: float, base_y: float):
        """
        Compute a field bbox in absolute coordinates (mm), anchored at the group's base_x/base_y.

        - Field x/y are relative to the exclGroup.
        - Field w/h should exist for radio items.
        - Caption reserve contributes to horizontal extent when placement is left/right.
        """
        fx = convert_to_mm(field.get("x")) or 0.0
        fy = convert_to_mm(field.get("y")) or 0.0
        fw = convert_to_mm(field.get("w"))
        fh = convert_to_mm(field.get("h"))

        if fw is None or fh is None:
            return None

        # Base bbox from the field's own geometry
        x1 = base_x + float(fx)
        y1 = base_y + float(fy)
        x2 = x1 + float(fw)
        y2 = y1 + float(fh)

        # Extend horizontally to include caption reserve when present.
        caption = field.find("caption")
        if caption is not None:
            placement = (caption.get("placement") or "").strip().lower()
            reserve = convert_to_mm(caption.get("reserve"))

            if reserve is not None and reserve > 0.0:
                if placement == "right":
                    x2 += float(reserve)
                elif placement == "left":
                    x1 -= float(reserve)
                # For top/bottom captions, reserve affects vertical space more than horizontal;
                # ignore for footprint clustering unless you later decide it matters.

        return (x1, y1, x2, y2)

    def to_form_element(self):
        options = []

        for field in self.xdp_element.findall(".//field"):
            button_text = get_field_caption(field)
            if button_text:
                options.append(button_text)

        if options:
            fe = FormInput(
                self.get_name(),
                self.full_path,
                self.get_type(),
                self.get_label().label if self.get_label() else None,
                self.context,
            )
            fe.enum = options
            fe.is_radio = True
            return fe
