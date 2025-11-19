import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class IfBlock:
    type: str  # "if", "elseif", or "else"
    condition: Optional[str]
    body: str


def parse_js_visibility_script(js_code: str) -> list[IfBlock]:
    """
    Parse Adobe-style JavaScript visibility rules into a list of IfBlock structures.
    Handles nested if / else if / else blocks robustly (no regex greediness).
    """
    code = re.sub(r"\s+", " ", js_code.strip())

    tokens = re.finditer(r"(if|else\s*if|else)\s*(\([^)]*\))?\s*\{", code)
    blocks: list[IfBlock] = []

    for match in tokens:
        keyword = match.group(1)
        cond = match.group(2)
        start = match.end()

        # Match braces manually — no regex can do this reliably
        depth = 1
        i = start
        while i < len(code) and depth > 0:
            if code[i] == "{":
                depth += 1
            elif code[i] == "}":
                depth -= 1
            i += 1

        body = code[start : i - 1].strip()
        block_type = (
            "if" if keyword == "if" else "elseif" if "else if" in keyword else "else"
        )

        blocks.append(IfBlock(block_type, cond.strip("() ") if cond else None, body))

    if not blocks:
        blocks.append(IfBlock("if", None, code))

    return blocks
