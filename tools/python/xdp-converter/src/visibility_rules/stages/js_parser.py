import re
from dataclasses import dataclass


@dataclass
class RuleBlock:
    # a trigger consists of a driver, a comparison operator, and a value
    # e.g. "thisField.value == 'Yes'"
    trigger: str

    # if or elseif implies trigger must evaluate to true
    # else implies the trigger must evaluate to false
    keyword: str  # TODO make this a boolean value

    # One or more actions: an action consists of a target (control)
    # and an effect (HIDE / SHOW)
    actions: str


def parse_js_visibility_script(js_code: str) -> list[RuleBlock]:
    """
    Parse Adobe-style JavaScript visibility rules into a list of RuleBlocks.
    Handles nested if / else if / else blocks.
    """
    code = re.sub(r"\s+", " ", js_code.strip())

    tokens = re.finditer(r"(if|else\s*if|else)\s*(\([^)]*\))?\s*\{", code)
    blocks: list[RuleBlock] = []

    for match in tokens:
        keyword = match.group(1)
        trigger = match.group(2)
        start = match.end()

        # Match braces
        depth = 1
        i = start
        while i < len(code) and depth > 0:
            if code[i] == "{":
                depth += 1
            elif code[i] == "}":
                depth -= 1
            i += 1

        actions = code[start : i - 1].strip()
        block_type = (
            "if" if keyword == "if" else "elseif" if "else if" in keyword else "else"
        )

        blocks.append(
            RuleBlock(
                keyword=block_type,
                trigger=trigger.strip("() ") if trigger else None,
                actions=actions,
            )
        )

    return blocks
