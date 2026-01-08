import re
import xml.etree.ElementTree as ET
from xdp_parser.xdp_utils import tag_name

# ----------------------------
# Tuning knobs (start here)
# ----------------------------
TITLE_MAX_LEN = 80  # anything longer is probably not a title
TITLE_MAX_LINES = 2  # titles shouldn't be paragraphs
TITLE_MIN_SCORE = 45  # must meet/exceed this to be accepted as a fallback title


def get_subform_header_label(subform: ET.Element) -> str | None:
    """
    Strong-signal title only:
      1) direct child <draw name="lblHeader">
      2) any descendant <draw name="lblHeader">
    Returns header text or None.
    """
    # 1) direct child lblHeader
    for child in list(subform):
        if tag_name(child.tag).lower() != "draw":
            continue
        if (child.attrib.get("name") or "").lower() == "lblheader":
            txt = _clean(text_of_value(child))
            if txt:
                return txt

    # 2) any descendant lblHeader
    for d in subform.iter():
        if tag_name(d.tag).lower() != "draw":
            continue
        if (d.attrib.get("name") or "").lower() == "lblheader":
            txt = _clean(text_of_value(d))
            if txt:
                return txt

    return None


def get_subform_label(
    subform: ET.Element,
    parent_map: dict[ET.Element, ET.Element] | None = None,
    *,
    allow_fallback_on_nested: bool = False,
) -> str | None:
    """
    Find the title for a <subform>.

    Preference order:
      1) <draw name="lblHeader"> direct child (strongest)
      2) <draw name="lblHeader"> descendant
      3) conservative fallback: choose best title-like draw ONLY if it clears a score threshold

    IMPORTANT:
    - Many nested subforms are just grouping/layout; they often have NO real title.
    - By default, fallback #3 is disabled for nested subforms if parent_map is provided,
      unless allow_fallback_on_nested=True.

    Returns a label string or None.
    """
    # 1 & 2) strong-signal header wins immediately
    header = get_subform_header_label(subform)
    if header:
        return header

    # If we can tell this subform is nested, be conservative:
    # nested subforms are frequently just structural wrappers.
    if parent_map is not None and not allow_fallback_on_nested:
        parent = parent_map.get(subform)
        if parent is not None and tag_name(parent.tag).lower() == "subform":
            return None

    # 3) fallback: score title candidates, accept only if confident
    best_txt: str | None = None
    best_score = -(10**9)

    for d in subform.iter():
        if tag_name(d.tag).lower() != "draw":
            continue

        txt = _clean(text_of_value(d))
        if not txt:
            continue

        score = _score_title_candidate(txt, draw_name=(d.attrib.get("name") or ""))
        if score > best_score:
            best_score = score
            best_txt = txt

    if best_txt and best_score >= TITLE_MIN_SCORE:
        return best_txt

    return None


def text_of_value(draw_el: ET.Element) -> str:
    """
    Extract text from a <value> under <draw>, looking for any <text> child first,
    otherwise the direct text content of <value>.
    """
    for child in draw_el:
        if tag_name(child.tag).lower() == "value":
            # prefer nested <text>
            for g in child.iter():
                if tag_name(g.tag).lower() == "text" and (g.text and g.text.strip()):
                    return g.text.strip()
            # else raw value text
            if child.text and child.text.strip():
                return child.text.strip()
            break
    return ""


# ----------------------------
# Internals
# ----------------------------
def _clean(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"\s+", " ", s)
    return s


def _score_title_candidate(txt: str, draw_name: str = "") -> int:
    """
    Higher score = more likely to be a reasonable title.
    Strong negative = likely help/instructions/paragraph.
    """
    score = 0
    name = (draw_name or "").lower()
    lower = txt.casefold()

    # Prefer label-ish naming conventions if present
    if any(k in name for k in ["lbl", "label", "title", "header", "caption"]):
        score += 40

    # Length heuristic
    n = len(txt)
    if n <= 40:
        score += 35
    elif n <= TITLE_MAX_LEN:
        score += 15
    else:
        score -= 90  # long = likely help text

    # Paragraph vibe: lots of punctuation usually means instructions
    if txt.count(".") >= 2:
        score -= 35
    if txt.count(";") >= 1:
        score -= 15
    if txt.count(":") >= 2:
        score -= 10

    # Instruction-y keywords (tune as you see real samples)
    if any(
        w in lower
        for w in [
            "please",
            "note",
            "do not",
            "must",
            "required",
            "instructions",
            "warning",
        ]
    ):
        score -= 70

    # Titles often look like "Section 3: Something"
    if re.match(r"^(section|part)\s+\d+", lower):
        score += 20

    # If it *looks* like a sentence, lean away from it
    if lower.startswith(("please ", "note ", "to ", "do ")):
        score -= 25

    return score
