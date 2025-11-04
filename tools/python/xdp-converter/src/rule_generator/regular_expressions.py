import re


# rule_generator/regular_expressions.py
COND_EQ_ANY_LHS_RE = re.compile(
    r"""^\s*\(*
        (?P<lhs>
            (?:this|[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)   # dotted path allowed
        )
        (?:\s*\.\s*rawValue\s*)?                        # .rawValue optional
        (?:==|===)\s*
        (?P<q>["'])?
        (?P<val>[^"'()\s]+)
        (?P=q)?
        \)*\s*;?\s*$
    """,
    re.VERBOSE,
)
COND_NE_ANY_LHS_RE = re.compile(
    r"""^\s*\(*
        (?P<lhs>(?:this|[A-Za-z_]\w*))\s*\.\s*rawValue\s*
        !=\s*
        (?P<q>["'])?(?P<val>[^"']+)(?P=q)?
        \)*\s*;?\s*$
    """,
    re.VERBOSE,
)

BANG_WRAP_RE = re.compile(r"^\s*!\s*\((?P<inner>.*)\)\s*$")

COND_EQ_RE = re.compile(
    r"""^\s*
        \(*                                   # optional opening parens
        (?P<lhs>(?:this|[A-Za-z_]\w*))        # `this` or a simple identifier (e.g., chkAdditional)
        \s*\.\s*rawValue\s*
        (?:==|===)\s*                         # == or ===
        (?P<q>["'])?                          # optional opening quote
        (?P<val>[^"'\s][^"']*)                # value (not starting with quote; keep loose)
        (?P=q)?                               # optional matching closing quote
        \)*\s*                                # optional closing parens
        ;?\s*$                                # optional semicolon then end
    """,
    re.VERBOSE,
)
