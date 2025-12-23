from collections.abc import Callable
import re
from dataclasses import dataclass

from visibility_rules.stages.trigger_ast import BooleanOp, ComparisonOp, Trigger


@dataclass(frozen=True)
class Token:
    kind: str
    text: str


class TriggerParseError(ValueError):
    pass


class TriggerParser:

    # comparison ops, longer first (handled in tokenization)
    _CMP_2 = ("==", "!=", ">=", "<=")
    _CMP_1 = (">", "<")

    def __init__(self):
        self.tokens: list[Token] = []
        self.pos: int = 0
        self.script_node = None

    def parse(self, text: str, script_node=None) -> Trigger:
        self.script_node = script_node
        self.tokens = self._tokenize(text)
        self.pos = 0

        if not self.tokens:
            raise TriggerParseError("Empty trigger expression")

        result = self._parse_expr()

        # Ensure we've consumed the entire input
        if not self._at_end():
            raise TriggerParseError(f"Unexpected token: {self._peek().text!r}")

        return result

    # ---------------------------
    # Tokenization
    # ---------------------------
    def _tokenize(self, s: str) -> list[Token]:
        s = (s or "").strip()
        if not s:
            return []

        tokens: list[Token] = []
        i = 0

        def startswith(x: str) -> bool:
            return s.startswith(x, i)

        while i < len(s):
            ch = s[i]

            # whitespace
            if ch.isspace():
                i += 1
                continue

            # boolean ops
            if startswith("&&"):
                tokens.append(Token("AND", "&&"))
                i += 2
                continue
            if startswith("||"):
                tokens.append(Token("OR", "||"))
                i += 2
                continue

            # parentheses
            if ch == "(":
                tokens.append(Token("LPAREN", ch))
                i += 1
                continue
            if ch == ")":
                tokens.append(Token("RPAREN", ch))
                i += 1
                continue

            # comparison ops (two-char first)
            matched = None
            for op in self._CMP_2:
                if startswith(op):
                    matched = op
                    break
            if matched:
                tokens.append(Token("CMP", matched))
                i += 2
                continue

            if ch in self._CMP_1:
                tokens.append(Token("CMP", ch))
                i += 1
                continue

            # quoted string
            if ch in ("'", '"'):
                quote = ch
                i += 1
                start = i
                # Simple string scanning; no escape sequences (keep it boring)
                while i < len(s) and s[i] != quote:
                    i += 1
                if i >= len(s):
                    raise TriggerParseError("Unterminated string literal")
                tokens.append(Token("STRING", s[start:i]))
                i += 1  # closing quote
                continue

            # word token: allow dots, underscores, dollars; includes numbers and keywords
            start = i
            while i < len(s) and re.match(r"[A-Za-z0-9_.$]", s[i]):
                i += 1
            if i == start:
                raise TriggerParseError(f"Unexpected character: {ch!r}")
            tokens.append(Token("WORD", s[start:i]))

        return tokens

    # ---------------------------
    # Grammar:
    #   expr    := or_expr
    #   or_expr := and_expr ( '||' and_expr )*
    #   and_expr:= primary ( '&&' primary )*
    #   primary := '(' expr ')' | comparison
    #   comparison := IDENT CMP VALUE
    # ---------------------------
    def _parse_expr(self) -> Trigger:
        return self._parse_or()

    def _parse_or(self) -> Trigger:
        left = self._parse_and()
        while self._match("OR"):
            right = self._parse_and()
            left = Trigger.compound(left, BooleanOp.OR, right)
        return left

    def _parse_and(self) -> Trigger:
        left = self._parse_primary()
        while self._match("AND"):
            right = self._parse_primary()
            left = Trigger.compound(left, BooleanOp.AND, right)
        return left

    def _parse_primary(self) -> Trigger:
        if self._match("LPAREN"):
            inner = self._parse_expr()
            if not self._match("RPAREN"):
                raise TriggerParseError("Expected ')'")
            return inner
        return self._parse_comparison()

    def _parse_comparison(self) -> Trigger:
        # IDENT / driver
        if not self._check("WORD"):
            raise TriggerParseError(f"Expected identifier, got {self._peek().text!r}")
        driver = self._advance().text

        # Normalize driver immediately
        driver = self._normalize_driver(driver)

        if not driver:
            raise TriggerParseError(
                "Could not determine driver (empty after normalization)"
            )

        # CMP operator
        if not self._check("CMP"):
            raise TriggerParseError(f"Expected comparison operator after {driver!r}")
        cmp_text = self._advance().text
        op = ComparisonOp.from_symbol(cmp_text)

        # VALUE (STRING or WORD)
        if self._check("STRING"):
            value = self._advance().text
        elif self._check("WORD"):
            value = self._advance().text
        else:
            raise TriggerParseError(f"Expected value after operator {cmp_text!r}")

        # Strip trailing semicolons (sometimes present in extracted snippets)
        value = value.strip()
        if value.endswith(";"):
            value = value[:-1].strip()

        return Trigger.atom(driver=driver, op=op, value=value)

    def _normalize_driver(self, driver: str) -> str:
        d = (driver or "").strip()

        # Strip trailing ".rawValue" immediately (suffix-only)
        if d.endswith(".rawValue"):
            d = d[: -len(".rawValue")].strip()
        return d

    # ---------------------------
    # Token helpers
    # ---------------------------
    def _peek(self) -> Token:
        return (
            self.tokens[self.pos] if self.pos < len(self.tokens) else Token("EOF", "")
        )

    def _advance(self) -> Token:
        t = self._peek()
        self.pos += 1
        return t

    def _check(self, kind: str) -> bool:
        return not self._at_end() and self._peek().kind == kind

    def _match(self, kind: str) -> bool:
        if self._check(kind):
            self._advance()
            return True
        return False

    def _at_end(self) -> bool:
        return self.pos >= len(self.tokens)
