import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple

from xdp_parser.xdp_utils import js_unescape


class JSHelpTextParser:
    def __init__(
        self,
        root: ET.Element,
        script_name: str = "soHelpButtons",
        object_name: str = "messages",
    ):
        self.root = root
        self.script_name = script_name
        self.object_name = object_name

    def get_messages(self) -> Dict[str, str]:
        """
        Parse <script name="{script_name}"> and return {key: value} from:
            var messages = { "key": "value", ... };
        """
        script_node = self._find_named_script(self.script_name)
        if script_node is None:
            return {}

        js = "".join(script_node.itertext()) or ""
        js = self._strip_js_comments(js)

        obj_body = self._find_object_body(js, self.object_name)
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

    # ---- Locate the script node --------------------------------------------

    def _find_named_script(self, name: str) -> Optional[ET.Element]:
        # Most XDPs: template/subform/variables/script[@name='...']
        for scr in self.root.findall(".//{*}variables//{*}script"):
            if (scr.get("name") or "").strip() == name:
                return scr
        return None

    # ---- Cleanup ------------------------------------------------------------

    @staticmethod
    def _strip_js_comments(js: str) -> str:
        js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        js = re.sub(r"//[^\n\r]*", "", js)
        return js

    # ---- Finding object body ------------------------------------------------

    def _find_object_body(self, js: str, obj_name: str) -> Optional[str]:
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

    # ---- Splitting & parsing ------------------------------------------------

    @staticmethod
    def _split_top_level_entries(obj_body: str) -> List[str]:
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
        if len(key_part) >= 2 and key_part[0] in "'\"" and key_part[-1] == key_part[0]:
            return js_unescape(key_part[1:-1])

        key = key_part.split(".")[-1].strip()
        return key or None

    @staticmethod
    def _parse_value(val_part: str) -> str:
        if len(val_part) >= 2 and val_part[0] in "'\"" and val_part[-1] == val_part[0]:
            return js_unescape(val_part[1:-1])

        m = re.search(r'("([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\')', val_part)
        if m:
            lit = m.group(0)
            return js_unescape(lit[1:-1])
        return val_part
