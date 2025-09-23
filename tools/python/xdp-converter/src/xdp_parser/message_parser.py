import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple

from xdp_parser.node_finder import NodeFinder


class JSHelpMessageParser:
    HELP_OBJECT_NAME = "messages"

    def __init__(self, root: ET.Element):
        finder = NodeFinder(root)
        self.variables = finder.find_first_node("variables")

    # ---- Public API ---------------------------------------------------------

    def get_messages(self) -> Dict[str, str]:
        """
        Parse <variables> element and return {key: value} from:
            var messages = { key: "value", "key2": 'value2' };
        """
        if self.variables is None:
            print("No <variables> element found.")
            return {}

        js = self._gather_js_text()
        js = self._strip_js_comments(js)

        obj_body = self._find_object_body(js, self.HELP_OBJECT_NAME)
        if obj_body is None:
            return {}

        entries = self._split_top_level_entries(obj_body)
        messages: Dict[str, str] = {}
        for entry in entries:
            kv = self._parse_entry(entry)
            if kv:
                k, v = kv
                messages[k] = v
        return messages

    # ---- Gathering & Cleanup -----------------------------------------------

    def _gather_js_text(self) -> str:
        """Concatenate all JS from <script> descendants; fallback to raw text."""
        script_texts: List[str] = []
        for scr in self.variables.findall(".//script"):
            txt = "".join(scr.itertext())
            if txt:
                script_texts.append(txt)
        if not script_texts:
            script_texts.append("".join(self.variables.itertext()))
        return "\n".join(script_texts)

    @staticmethod
    def _strip_js_comments(js: str) -> str:
        """Remove /* ... */ and // ... comments."""
        js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        js = re.sub(r"//[^\n\r]*", "", js)
        return js

    # ---- Finding the object body -------------------------------------------

    def _find_object_body(self, js: str, obj_name: str) -> Optional[str]:
        """
        Locate `obj_name = { ... }` and return the inner text (without braces).
        Supports optional var/let/const.
        """
        # e.g., var messages = { ... }, let messages = { ... }, messages = { ... }
        pat = rf"\b(?:var|let|const)?\s*{re.escape(obj_name)}\s*=\s*{{"
        m = re.search(pat, js)
        if not m:
            return None

        start_brace = js.find("{", m.end() - 1)
        if start_brace == -1:
            return None

        end_brace = self._brace_match(js, start_brace)
        if end_brace is None:
            return None

        return js[start_brace + 1 : end_brace]

    @staticmethod
    def _brace_match(s: str, start_idx: int) -> Optional[int]:
        """
        Return index of the matching closing brace for s[start_idx] == '{'.
        Respects quotes and escapes so braces inside strings are ignored.
        """
        i = start_idx
        depth = 0
        in_str = False
        quote = ""
        escape = False

        while i < len(s):
            ch = s[i]
            if in_str:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == quote:
                    in_str = False
            else:
                if ch in ("'", '"'):
                    in_str = True
                    quote = ch
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        return i
            i += 1
        return None

    # ---- Splitting & Parsing entries ---------------------------------------

    @staticmethod
    def _split_top_level_entries(obj_body: str) -> List[str]:
        """
        Split `{ a: "x", b: "y" }` into ["a: "x"", "b: "y""].
        Ignores commas inside strings or nested {...}.
        """
        entries: List[str] = []
        buf: List[str] = []

        in_str = False
        quote = ""
        escape = False
        brace_depth = 0

        for ch in obj_body:
            if in_str:
                buf.append(ch)
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == quote:
                    in_str = False
            else:
                if ch in ("'", '"'):
                    in_str = True
                    quote = ch
                    buf.append(ch)
                elif ch == "{":
                    brace_depth += 1
                    buf.append(ch)
                elif ch == "}":
                    brace_depth = max(0, brace_depth - 1)
                    buf.append(ch)
                elif ch == "," and brace_depth == 0:
                    entry = "".join(buf).strip()
                    if entry:
                        entries.append(entry)
                    buf = []
                else:
                    buf.append(ch)

        tail = "".join(buf).strip()
        if tail:
            entries.append(tail)

        return entries

    def _parse_entry(self, entry: str) -> Optional[Tuple[str, str]]:
        """
        Parse a single `key: "value"` entry. Supports:
        - quoted/unquoted keys
        - single/double-quoted values
        Falls back to grabbing the first quoted literal from the value part.
        """
        entry = entry.strip().rstrip(",;").strip()
        if not entry:
            return None

        # split on first colon not in string
        in_str = False
        quote = ""
        escape = False
        split_at = -1
        for idx, ch in enumerate(entry):
            if in_str:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == quote:
                    in_str = False
            else:
                if ch in ("'", '"'):
                    in_str = True
                    quote = ch
                elif ch == ":":
                    split_at = idx
                    break
        if split_at == -1:
            return None

        key_part = entry[:split_at].strip()
        val_part = entry[split_at + 1 :].strip()

        key = self._parse_key(key_part)
        if not key:
            return None

        val = self._parse_value(val_part)
        return (key, val)

    @staticmethod
    def _parse_key(key_part: str) -> Optional[str]:
        """Handle "quoted", 'quoted', or unquoted identifiers (take last segment after dots)."""
        if len(key_part) >= 2 and key_part[0] in "'\"" and key_part[-1] == key_part[0]:
            return JSHelpMessageParser._unescape_js_string(key_part[1:-1])
        # Unquoted: allow a.b.c (take final identifier)
        key = key_part.split(".")[-1].strip()
        return key or None

    @staticmethod
    def _parse_value(val_part: str) -> str:
        """
        Prefer a full quoted literal; otherwise grab first quoted chunk;
        otherwise return raw text.
        """
        if len(val_part) >= 2 and val_part[0] in "'\"" and val_part[-1] == val_part[0]:
            return JSHelpMessageParser._unescape_js_string(val_part[1:-1])

        m = re.search(r'("([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\')', val_part)
        if m:
            lit = m.group(0)
            return JSHelpMessageParser._unescape_js_string(lit[1:-1])
        return val_part

    @staticmethod
    def _unescape_js_string(s: str) -> str:
        """Unescape common JS string escapes and \\uXXXX sequences."""
        s = (
            s.replace(r"\\", "\\")
            .replace(r"\/", "/")
            .replace(r"\'", "'")
            .replace(r"\"", '"')
            .replace(r"\n", "\n")
            .replace(r"\r", "\r")
            .replace(r"\t", "\t")
            .replace(r"\b", "\b")
            .replace(r"\f", "\f")
        )

        def _u(m):
            try:
                return chr(int(m.group(1), 16))
            except Exception:
                return m.group(0)

        return re.sub(r"\\u([0-9a-fA-F]{4})", _u, s)
