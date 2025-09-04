import re
from typing import Optional

def strip_namespace(tag: str) -> str:
    """Remove namespace from XML tag."""
    return tag.split('}')[-1] if '}' in tag else tag

_PREFIXES = ["txt", "btn", "chk", "dte", "lbl","cbo"]
def strip_label_prefix(label: str) -> str:
    for prefix in _PREFIXES:
        if label.lower().startswith(prefix.lower()):
            return label[len(prefix):]
    return label

def split_camel_case(s: str) -> str:
    """Split a camel case string into separate words, keeping acronyms intact, and splitting before numbers."""
    # Insert space before capital letters that follow lowercase letters and are followed by lowercase (e.g. FredIs -> Fred Is)
    s = re.sub(r'(?<=[a-z])(?=[A-Z][a-z])', ' ', s)
    # Insert space before acronym sequences if preceded by lowercase (e.g. myHTTP -> my HTTP)
    s = re.sub(r'(?<=[a-z])(?=[A-Z]{2,})', ' ', s)
    # Insert space before numbers if preceded by letters (e.g. Is100 -> Is 100)
    s = re.sub(r'(?<=[a-zA-Z])(?=\d)', ' ', s)
    return s

def remove_duplicates(seq):
    seen = set()
    return [x for x in seq if not (x in seen or seen.add(x))]

def name_to_scope(name: str) -> Optional[str]:
    # naive: assume identical names map to data properties
    return f"#/properties/{name}"

# best-effort type cast
def string_to_value(raw: str) -> str | int | float:
    try:
        val = int(raw)
    except ValueError:
        try:
            val = float(raw)
        except ValueError:
            val = raw  # keep as string if not numeric
    return val