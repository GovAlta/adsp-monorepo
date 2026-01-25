import re
import xml.etree.ElementTree as ET
from schema_generator.html_to_markdown import html_to_markdown
from xdp_parser.help_text_registry import HelpTextRegistry
from xdp_parser.xdp_utils import js_unescape


# ---------------------------------------------------------------------
# Safe messageBox matcher (no catastrophic backtracking)
# ---------------------------------------------------------------------
MSGBOX_RE = re.compile(
    r"""
    xfa\.host\.messageBox\s*\(\s*
    (?P<arg1>
        "(?:\\.|[^"\\])*"         # double-quoted string literal
      | '(?:\\.|[^'\\])*'         # single-quoted string literal
      | [A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*  # identifier / dotted path
    )
    (?:\s*,\s*
        (?P<arg2>
            "(?:\\.|[^"\\])*"
          | '(?:\\.|[^'\\])*'
          | [A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*
        )
    )?
    """,
    re.VERBOSE | re.DOTALL,
)


def _parse_js_arg_token(token: str | None) -> tuple[str | None, bool]:
    """
    Returns (value, is_string_literal).
    If token is quoted, value is inner (still escaped) string contents.
    If token is identifier/path, value is the identifier text.
    """
    if token is None:
        return None, False

    t = token.strip()
    if len(t) >= 2 and t[0] == t[-1] and t[0] in ("'", '"'):
        return t[1:-1], True

    return t, False


def extract_messagebox(js: str) -> dict | None:
    """
    Extract first and optional second argument from xfa.host.messageBox(...).

    Returns:
      {
        "text": <raw string contents OR identifier>,
        "title": <raw string contents OR identifier OR None>,
        "text_is_literal": bool,
        "title_is_literal": bool,
      }
    """
    if "xfa.host.messageBox" not in js:
        return None

    # Limit scan window to reduce worst-case cost on huge blobs
    i = js.find("xfa.host.messageBox")
    window = js[i : i + 20000] if i != -1 else js

    m = MSGBOX_RE.search(window)
    if not m:
        return None

    text_raw, text_is_lit = _parse_js_arg_token(m.group("arg1"))
    title_raw, title_is_lit = _parse_js_arg_token(m.group("arg2"))

    return {
        "text": text_raw,
        "title": title_raw,
        "text_is_literal": text_is_lit,
        "title_is_literal": title_is_lit,
    }


# ---------------------------------------------------------------------
# JS string literal scanner (linear time, CodeQL-friendly)
# ---------------------------------------------------------------------
def iter_js_string_literals(js: str):
    """
    Yield raw (still-escaped) contents of JS single- or double-quoted string literals.

    Notes:
      - Permissive: doesn't try to skip comments or template strings.
      - Safe: linear scan, respects backslash escapes.
    """
    i, n = 0, len(js)
    while i < n:
        q = js[i]
        if q not in ("'", '"'):
            i += 1
            continue

        i += 1  # move past opening quote
        start = i
        chunks: list[str] = []

        while i < n:
            c = js[i]
            if c == "\\":  # escape sequence
                if i + 1 < n:
                    # flush preceding chunk, keep escape pair as-is
                    if start < i:
                        chunks.append(js[start:i])
                    chunks.append(js[i : i + 2])
                    i += 2
                    start = i
                    continue
                # dangling backslash; stop this literal
                i += 1
                break

            if c == q:  # closing quote
                if start < i:
                    chunks.append(js[start:i])
                yield "".join(chunks)
                i += 1
                break

            i += 1
        else:
            # Unterminated string literal; stop scanning
            return


class HelpTextExtractor:
    @staticmethod
    def get_help_from_draw(node: ET.Element) -> str | None:
        """
        Extract help/guidance text with correct priority:

        1) Click script payload (e.g., xfa.host.messageBox("..."))
        2) Draw/exData blocks (static guidance)
        """
        MIN_SIZE_DRAW = 1
        MIN_SIZE_EVENT = 5
        MAX_SIZE_EVENT = 2000

        tag = node.tag.split("}", 1)[-1].lower()

        # ------------------------------------------------------------
        # 1) FIELD/EXCLGROUP: click event messageBox is the gold standard
        # ------------------------------------------------------------
        if tag in {"field", "exclgroup"}:
            msg = HelpTextExtractor._help_from_click_messagebox(node)
            if msg and msg.get("text"):
                text = msg["text"].strip()[:MAX_SIZE_EVENT]
                if len(text) >= MIN_SIZE_EVENT:
                    return text
            return None

        # ------------------------------------------------------------
        # 2) DRAW/EXDATA: static help blocks
        # ------------------------------------------------------------
        if tag in {"draw", "exdata"}:
            # Ignore bind/calculate/event scripts under draw
            if any(
                node.findall(f".//{{*}}{t}") for t in ("bind", "calculate", "event")
            ):
                return None

            exdata = node.find(".//{*}value/{*}exData[@contentType='text/html']")
            if exdata is not None:
                html = HelpTextExtractor._extract_html_from_exdata(exdata)
                if html:
                    md = html_to_markdown(html)
                    md = re.sub(r"\n{3,}", "\n\n", md).strip()
                    if len(md) >= MIN_SIZE_DRAW:
                        return md

            text_node = node.find(".//{*}value/{*}text")
            if text_node is not None and (text_node.text or "").strip():
                text = text_node.text.strip()
                if len(text) >= MIN_SIZE_DRAW:
                    return text

            if (node.text or "").strip() and len(node.text.strip()) >= MIN_SIZE_DRAW:
                return node.text.strip()

            return None

        return None

    @staticmethod
    def _help_from_click_messagebox(field_node: ET.Element) -> dict | None:
        """
        Extract the first string arg from xfa.host.messageBox("...") in click event scripts.
        Only returns a result if the message is a literal string (static).
        """
        for ev in field_node.findall(".//{*}event[@activity='click']"):
            for script in ev.findall(".//{*}script"):
                script_text = "".join(script.itertext()) or ""
                script_text = script_text.strip()
                if not script_text:
                    continue

                help = extract_messagebox(script_text)
                if not help or not help.get("text"):
                    continue

                # If message is dynamic (identifier/expression), skip static extraction
                if not help.get("text_is_literal"):
                    continue

                msg = js_unescape(help["text"] or "")
                msg = msg.replace(r"\n", "\n").replace(r"\t", "\t").replace(r"\\", "\\")
                msg = msg.replace(r"\'", "'").replace(r"\"", '"')

                # preserve newlines, normalize stray spaces around them
                msg = re.sub(r"[ \t]+\n", "\n", msg)
                msg = re.sub(r"\n[ \t]+", "\n", msg)

                title = None
                if help.get("title") and help.get("title_is_literal"):
                    # keep title metadata, but decode it consistently
                    title = js_unescape(help["title"]).strip()

                return {"text": msg, "title": title}

        return None

    @staticmethod
    def get_help_from_click_event(field_node: ET.Element) -> dict | None:
        """
        Returns a help payload:
          {"title": str | None, "text": str, "source": "..."}
        """
        scripts: list[str] = []
        for ev in field_node.findall(".//{*}event[@activity='click']"):
            for script in ev.findall(".//{*}script"):
                txt = "".join(script.itertext()).strip()
                if txt:
                    scripts.append(txt)

        if not scripts:
            return None

        js = "\n".join(scripts)

        # 1) Inside the help registry (most semantic)
        registry = HelpTextRegistry()
        key = HelpTextExtractor._find_help_key_literal(js, registry)
        if key:
            text = registry.get_annotation(key).strip()
            if text:
                return {"title": key, "text": text, "source": "HelpTextRegistry"}

        # 2) Inside a direct messageBox (static string only)
        mb = extract_messagebox(js)
        if mb and mb.get("text") and mb.get("text_is_literal"):
            text = js_unescape(mb["text"]).strip()
            title = None
            if mb.get("title") and mb.get("title_is_literal"):
                title = js_unescape(mb["title"]).strip()
            return {"title": title, "text": text, "source": "messageBox"}

        return None

    @staticmethod
    def _find_help_key_literal(js: str, registry: HelpTextRegistry) -> str | None:
        """
        Scan JS click script for a string literal that matches a known help key.
        Works for: soHelpButtons.show("Equipment to Transfer") and similar patterns.

        Strategy:
          - Extract all string literals in the script (scanner, escape-aware)
          - Unescape them
          - Return the first one that exists in the registry
        """
        for raw in iter_js_string_literals(js):
            lit = js_unescape(raw).strip()
            if lit and registry.has_annotation(lit):
                return lit
        return None

    @staticmethod
    def is_help_icon_field(field_node: ET.Element) -> bool:
        if field_node.tag.split("}", 1)[-1].lower() != "field":
            return False

        if field_node.find(".//{*}ui/{*}button") is None:
            return False

        if field_node.find(".//{*}event[@activity='click']") is None:
            return False

        name = (field_node.get("name") or "").lower()
        caption = (
            (field_node.findtext(".//{*}caption/{*}value/{*}text") or "")
            .strip()
            .lower()
        )

        name_hint = "help" in name
        iconish = caption in {"i", "?", "!"} or (
            len(caption) == 1 and caption.isalpha()
        )

        # optional: size hint if present
        def mm(attr: str):
            v = field_node.get(attr) or ""
            m = re.match(r"^\s*([0-9]*\.?[0-9]+)\s*mm\s*$", v, re.IGNORECASE)
            return float(m.group(1)) if m else None

        w = mm("w")
        h = mm("h")
        tiny = w is not None and h is not None and w <= 7.0 and h <= 7.0

        return (tiny and (iconish or name_hint)) or (name_hint and iconish)

    @staticmethod
    def _extract_html_from_exdata(exdata: ET.Element) -> str:
        # If exData contains nested markup, preserve it
        children = list(exdata)
        if children:
            return "".join(
                ET.tostring(c, encoding="unicode", method="html") for c in children
            ).strip()

        # Otherwise it may just be raw text that *is* HTML
        return (exdata.text or "").strip()
