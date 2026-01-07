import re
import xml.etree.ElementTree as ET
from schema_generator.html_to_markdown import html_to_markdown
from xdp_parser.help_text_registry import HelpTextRegistry
from xdp_parser.xdp_utils import js_unescape


class HelpTextExtractor:

    @staticmethod
    def get_help_from_draw(node):
        """
        Extract help/guidance text with correct priority:

        1) Click script payload (e.g., xfa.host.messageBox("..."))
        2) Draw/exData blocks (static guidance)
        """
        MIN_SIZE_DRAW = 20
        MIN_SIZE_EVENT = 5
        MAX_SIZE_EVENT = 2000

        tag = node.tag.split("}", 1)[-1].lower()

        # ------------------------------------------------------------
        # 1) FIELD/EXCLGROUP: click event messageBox is the gold standard
        # ------------------------------------------------------------
        if tag in {"field", "exclgroup"}:
            msg = HelpTextExtractor._help_from_click_messagebox(node)
            if msg and msg.get("text"):
                msg = msg["text"].strip()[:MAX_SIZE_EVENT]
                if len(msg) >= MIN_SIZE_EVENT:
                    return msg

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
    def _help_from_click_messagebox(field_node):
        """
        Extract the first string arg from xfa.host.messageBox("...") in click event scripts.
        """
        for ev in field_node.findall(".//{*}event[@activity='click']"):
            for script in ev.findall(".//{*}script"):
                script_text = "".join(script.itertext()) or ""
                script_text = script_text.strip()
                if not script_text:
                    continue

                help = extract_messagebox(script_text)
                if not help:
                    continue

                msg = help["text"]
                msg = msg.replace(r"\n", "\n").replace(r"\t", "\t").replace(r"\\", "\\")
                msg = msg.replace(r"\'", "'").replace(r"\"", '"')

                # preserve newlines, normalize stray spaces
                msg = re.sub(r"[ \t]+\n", "\n", msg)
                msg = re.sub(r"\n[ \t]+", "\n", msg)

                return {"text": msg, "title": help["title"]}

        return None

    @staticmethod
    def get_help_from_click_event(field_node: ET.Element) -> dict | None:
        """
        Returns a help payload:
          {"title": str | None, "text": str, "source": "messageBox"|"soHelpButtons.show"}
        """
        scripts = []
        for ev in field_node.findall(".//{*}event[@activity='click']"):
            for script in ev.findall(".//{*}script"):
                txt = "".join(script.itertext()).strip()
                if txt:
                    scripts.append(txt)

        if not scripts:
            return None

        js = "\n".join(scripts)

        # Inside the help registry
        registry = HelpTextRegistry()
        key = HelpTextExtractor._find_help_key_literal(js, registry)
        if key:
            text = registry.get_annotation(key).strip()
            if text:
                return {"title": key, "text": text, "source": "HelpTextRegistry"}

        # Inside a direct messageBox
        m = extract_messagebox(js)
        if m:
            return m
        return None

    @staticmethod
    def _find_help_key_literal(js: str, registry: HelpTextRegistry) -> str | None:
        """
        Scan JS click script for a string literal that matches a known help key.
        Works for: soHelpButtons.show("Equipment to Transfer") and similar patterns.

        Strategy:
          - Extract all string literals in the script
          - Unescape them
          - Return the first one that exists in the registry
        """
        # Find all JS string literals (single or double quotes), respecting escapes
        for m in re.finditer(r'(?P<q>["\'])(?P<s>(?:\\.|(?!\1).)*)\1', js, re.DOTALL):
            lit = js_unescape(m.group("s") or "").strip()
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
        def mm(attr):
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


MSGBOX_RE = re.compile(
    r"""
    xfa\.host\.messageBox\s*\(\s*
    (?P<arg1>
        "(?:\\.|[^"\\])*"         # double-quoted string literal
      | '(?:\\.|[^'\\])*'         # single-quoted string literal
      | [A-Za-z_$][\w$]*          # identifier (e.g., message)
    )
    (?:\s*,\s*
        (?P<arg2>
            "(?:\\.|[^"\\])*"
          | '(?:\\.|[^'\\])*'
          | [A-Za-z_$][\w$]*
        )
    )?
    """,
    re.VERBOSE | re.DOTALL,
)


def _unquote_js_string(token: str) -> str:
    token = token.strip()
    if len(token) >= 2 and token[0] == token[-1] and token[0] in ("'", '"'):
        return token[1:-1]
    return token  # identifier/expression


def extract_messagebox(js: str):
    # Cheap prefilter
    if "xfa.host.messageBox" not in js:
        return None

    # Optional: window around first hit to limit scanning
    i = js.find("xfa.host.messageBox")
    window = js[i : i + 20000] if i != -1 else js

    m = MSGBOX_RE.search(window)
    if not m:
        return None

    text = _unquote_js_string(m.group("arg1"))
    title = _unquote_js_string(m.group("arg2")) if m.group("arg2") else None
    return {"text": text, "title": title}
