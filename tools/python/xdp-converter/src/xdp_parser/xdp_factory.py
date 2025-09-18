import xml.etree.ElementTree as ET

from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_information import XdpInformation
from xdp_parser.xdp_utils import strip_namespace


def xdp_factory(xdp: ET.Element) -> XdpElement | None:
    match strip_namespace(xdp.tag):
        case "exclGroup":
            return XdpRadio(xdp)
        case "field":
            if _looks_like_help_button(xdp):
                return XdpInformation(xdp)
            return XdpBasicInput(xdp)
    return None


HELP_SCRIPT_HINTS = (
    "xfa.host.messageBox",
    "app.alert",
    "messageBox",
    "openHelp",
    "showHelp",
    "helpDialog",
)


def _has_button_ui(field: ET.Element) -> bool:
    return field.find(".//ui/button") is not None


def _has_click_script(field: ET.Element) -> bool:
    ev = field.find(".//event[@name='click']")
    if ev is None:
        return False
    scr = ev.find(".//script")
    if scr is None:
        return False
    txt = "".join(scr.itertext()).strip().lower()
    return any(hint.lower() in txt for hint in HELP_SCRIPT_HINTS)


def _caption_text(field: ET.Element) -> str:
    cap = field.find(".//caption/value")
    if cap is not None:
        return "".join(cap.itertext()).strip()
    return ""


def _tooltip_text(field: ET.Element) -> str:
    tip = field.find(".//assist/toolTip/value")
    if tip is not None:
        return "".join(tip.itertext()).strip()
    return ""


def _looks_like_help_button(field: ET.Element) -> bool:
    name = (field.get("name") or "").lower()
    cap = _caption_text(field).strip().lower()

    # Strong signals
    if _has_button_ui(field) and _has_click_script(field):
        return True

    # Name + intention
    if name.startswith("btn") and "help" in name:
        return True

    # Icon-ish caption + button or script
    if cap in {"i", "?", "info"} and (
        _has_button_ui(field) or _has_click_script(field)
    ):
        return True

    # Last resort: tooltip exists and looks non-trivial plus button UI
    tooltip = _tooltip_text(field)
    if _has_button_ui(field) and len(tooltip) > 0 and len(tooltip.split()) >= 2:
        return True

    return False
