from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict
import xml.etree.ElementTree as ET

from xdp_parser.parsing_helpers import split_label_and_help
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_checkbox import XdpCheckbox
from xdp_parser.xdp_help_control_pair import XdpHelpControlPair
from xdp_parser.xdp_radio_selector import XdpRadioSelector
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_utils import DisplayText

debug = True


@dataclass
class PseudoRadioOption:
    checkbox: XdpCheckbox
    label: DisplayText
    detail_help: str  # long help from icon click, if present


def transform_pseudo_radios_in_subform(
    subform: ET.Element,
    elements: List[XdpElement],
    context: ParseContext,
) -> List[XdpElement]:
    result = []
    i = 0

    while i < len(elements):
        elem = elements[i]

        # START RUN only if:
        # - this is a circle checkbox
        # - AND either it's the first element
        # - OR the previous element is NOT part of a pseudo-radio option
        if _is_circle_checkbox(elem):
            options, run_end = _collect_pseudo_radio_run(elements, i)

            if len(options) >= 2:
                radio = _build_radio_selector_from_run(subform, options, context)
                result.append(radio)
                i = run_end
                continue

        result.append(elem)
        i += 1

    return result


def _is_circle_checkbox(e: XdpElement) -> bool:
    return e.is_control() and e.is_circle_checkbutton()


def pair_targets_checkbox(pair: XdpHelpControlPair, checkbox: XdpCheckbox) -> bool:
    return pair.control is checkbox


def _collect_pseudo_radio_run(
    elements: list[XdpElement],
    start_index: int,
) -> tuple[list[PseudoRadioOption], int]:
    """
    Collect a consecutive run of circle-style checkButtons that form a pseudo-radio group.

    Association rules (in priority order):
      checkbox
        -> traversal_target_name → help icon (XdpHelpIcon)
            -> traversal_target_name → label/description draw (XdpHelpText)

    All searches are bounded to the slice between this checkbox and the next
    circle-checkbox to avoid cross-option contamination.
    """
    options: list[PseudoRadioOption] = []
    i = start_index

    while i < len(elements):
        checkbox_elem = elements[i]

        if not _is_circle_checkbox(checkbox_elem):
            break

        checkbox: XdpCheckbox = checkbox_elem

        # determine the slice that belongs to this option
        next_cb_index = _find_next_circle_checkbox_index(elements, i + 1)
        slice_end = next_cb_index if next_cb_index is not None else len(elements)

        # ---- follow traversal: checkbox -> help icon ----
        help_icon = _find_help_icon_by_name(
            elements,
            name=checkbox.traversal_target_name,
            start=i + 1,
            end=slice_end,
        )

        # ---- follow traversal: help icon -> label draw ----
        label_draw = None
        if help_icon is not None:
            label_draw = _find_help_text_by_name(
                elements,
                name=help_icon.traversal_target_name,
                start=i + 1,
                end=slice_end,
            )

        # ---- extract label + description ----
        label = ""
        description = ""

        # preferred source: checkbox label (once your bug fix lands)
        checkbox_label = checkbox.get_label()
        if checkbox_label:
            label = checkbox_label

        # fallback: overloaded label draw text
        if label_draw is not None:
            raw = (label_draw.help_text() or "").strip()
            if raw:
                lbl, desc = split_label_and_help(raw)
                if not label:
                    label = (lbl or "").strip()
                description = (desc or "").strip()

        if not label:
            label = checkbox.get_name()

        # ---- extract detail help (icon click text) ----
        detail_help = ""
        if help_icon is not None:
            detail_help = (help_icon.help_text() or "").strip()

        options.append(
            PseudoRadioOption(
                checkbox=checkbox,
                label=label,
                detail_help=detail_help,
            )
        )

        i = slice_end

    return options, i


def _build_radio_selector_from_run(
    subform: ET.Element,
    options: list[PseudoRadioOption],
    context: ParseContext,
) -> XdpRadioSelector:
    """
    Build a radio selector.
    - Radio enum values are option_value (text.label or fallback).
    - Description + detail help are attached so the UI layer can render them.
    """

    option_values: list[str] = []
    option_description_by_value: dict[str, str] = {}
    option_detail_help_by_value: dict[str, str] = {}

    for opt in options:
        # enum value
        value = (opt.label.label or "").strip()
        if not value:
            value = opt.checkbox.get_name()

        option_values.append(value)

        # metadata for UI rendering
        desc = (opt.label.description or "").strip()
        if desc:
            option_description_by_value[value] = desc

        help_text = (opt.detail_help or "").strip()
        if help_text:
            option_detail_help_by_value[value] = help_text

        if debug:
            d = f" — {desc}" if desc else ""
            print(f"  [Pseudo-radio] option: '{value}'{d}")

    radio = XdpRadioSelector(subform, option_values, context.help_text)

    # Choose names you like; these can be consumed later by to_form_element()
    radio.option_descriptions = option_description_by_value
    radio.option_detail_help = option_detail_help_by_value

    return radio


def _find_next_circle_checkbox_index(
    elements: list[XdpElement], start: int
) -> int | None:
    for idx in range(start, len(elements)):
        if _is_circle_checkbox(elements[idx]):
            return idx
    return None


def _find_help_icon_by_name(
    elements: list[XdpElement],
    name: str | None,
    start: int,
    end: int,
) -> XdpElement | None:
    if not name:
        return None
    for e in elements[start:end]:
        if e.get_name() == name and e.is_help_icon():
            return e
    return None


def _find_help_text_by_name(
    elements: list[XdpElement],
    name: str | None,
    start: int,
    end: int,
) -> XdpElement | None:
    if not name:
        return None
    for e in elements[start:end]:
        if e.get_name() == name and e.is_help_text() and not e.is_help_icon():
            return e
    return None


def print_debug(subform, msg: str):
    if debug and subform.get("name", "") == "Section2":
        print(msg)
