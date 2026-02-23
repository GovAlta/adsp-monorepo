import argparse
import json
import sys
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback
from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_JSONFORMS_RULES,
    CTX_LABEL_TO_ENUM,
    CTX_PARENT_MAP,
    CTX_RADIO_GROUPS,
    CTX_SUBFORM_MAP,
    CTX_XDP_ROOT,
    PipelineContext,
)
from schema_generator.json_schema_generator import JsonSchemaGenerator
from schema_generator.ui_schema_generator import UiSchemaGenerator
import xml.etree.ElementTree as ET
from visibility_rules.subform_mapper import map_subforms
from xdp_parser.factories.enum_map_factory import EnumMapFactory, normalize_enum_labels
from xdp_parser.factories.xdp_element_factory import XdpElementFactory
from xdp_parser.help_text_parser import JSHelpTextParser
from xdp_parser.help_text_registry import HelpTextRegistry
from xdp_parser.parse_context import ParseContext
from xdp_parser.parse_xdp import XdpParser
from xdp_parser.xdp_utils import build_parent_map, strip_namespaces
from visibility_rules.pipeline import VisibilityRulesPipeline

debug = False


def discover_xdp_files(inputs):
    files = []
    for item in inputs:
        p = Path(item)
        # Expand globs like "*.xdp"
        if any(ch in item for ch in ["*", "?", "["]):
            files.extend(Path().glob(item))
            continue
        if p.is_dir():
            files.extend(p.rglob("*.xdp"))
        elif p.is_file() and p.suffix.lower() == ".xdp":
            files.append(p)
        else:
            print(f"⚠️  Skipping non-xdp path: {item}", file=sys.stderr)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for f in files:
        fp = f.resolve()
        if fp not in seen:
            seen.add(fp)
            unique.append(fp)
    return unique


def output_paths(input_file: Path, out_dir: Path):
    stem = input_file.stem
    schema_path = out_dir / f"{stem}.schema.json"
    ui_path = out_dir / f"{stem}.ui.json"
    return schema_path, ui_path


def process_one(xdp_path: Path, out_dir: Path, overwrite: bool = False):
    try:
        schema_out, ui_out = output_paths(xdp_path, out_dir)

        if not overwrite and (schema_out.exists() or ui_out.exists()):
            return (xdp_path, False, "exists")

        if debug:
            print(f"🧩 Parsing {xdp_path}…")

        # --- Parse XDP and strip namespaces ---
        tree = strip_namespaces(ET.parse(xdp_path))
        root = tree.getroot()

        # --- Build parent map ---
        parent_map = build_parent_map(root)
        subform_map = map_subforms(root)

        # --- Load help text  ---
        registry = HelpTextRegistry()
        registry.load_messages(root)

        help_text_parser = JSHelpTextParser(tree)
        help_text = help_text_parser.get_messages()

        # --- Extract enum maps ---
        enum_context = ParseContext(root=root, parent_map=parent_map, radio_groups={})
        enum_factory = EnumMapFactory(enum_context)
        traversal = XdpParser(enum_factory, enum_context)
        traversal.parse_xdp()

        normalized_enum_maps = normalize_enum_labels(
            traversal.factory.enum_maps, enum_factory.label_to_enum
        )

        # Keep the actual field names as the group members
        normalized_radio_groups = enum_context.radio_groups

        # --- Run the visibility pipeline ---
        pipeline = VisibilityRulesPipeline()
        pipeline_context = PipelineContext(
            {
                CTX_XDP_ROOT: root,
                CTX_ENUM_MAP: normalized_enum_maps,
                CTX_PARENT_MAP: parent_map,
                CTX_LABEL_TO_ENUM: enum_factory.label_to_enum,
                CTX_RADIO_GROUPS: normalized_radio_groups,
                CTX_SUBFORM_MAP: subform_map,
            }
        )

        pipeline_output = pipeline.run(pipeline_context)
        jsonforms_rules = pipeline_output.get(CTX_JSONFORMS_RULES, {})

        if debug:
            print(f"Generated visibility rules for {len(jsonforms_rules)} element(s).")
            print(jsonforms_rules)

        top_subforms = set(id(sf) for sf in XdpParser.find_top_subforms(root))
        context = ParseContext(
            root=root,
            parent_map=parent_map,
            radio_groups=normalized_radio_groups,
            help_text=help_text,
            jsonforms_rules=jsonforms_rules,
            top_subforms=top_subforms,
        )

        parser = XdpParser(XdpElementFactory(context), context)
        input_groups = parser.parse_xdp()

        # --- Generate schemas ---
        json_generator = JsonSchemaGenerator()
        json_schema = json_generator.to_schema(input_groups)

        ui_generator = UiSchemaGenerator(input_groups, context)
        ui_schema = ui_generator.to_schema()

        # --- Write output files ---
        schema_out.parent.mkdir(parents=True, exist_ok=True)
        with schema_out.open("w", encoding="utf-8") as f:
            json.dump(json_schema, f, indent=4, ensure_ascii=False)

        with ui_out.open("w", encoding="utf-8") as f:
            json.dump(ui_schema, f, indent=4, ensure_ascii=False)

        return (xdp_path, True, None)

    except Exception as e:
        traceback.print_exc()
        return (xdp_path, False, str(e))


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="generate_schemas.py",
        description="""Generate JSON and UI schemas from ONE XDP file.

Example:
  python3 generate_schemas.py form1.xdp -o out/ --overwrite
""",
        formatter_class=argparse.RawTextHelpFormatter,
    )

    parser.add_argument(
        "xdp_file",
        help="Input XDP file path (exactly one).",
    )
    parser.add_argument(
        "-o",
        "--out-dir",
        default=".",
        help="Directory to write outputs (default: current dir).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing output files.",
    )

    args = parser.parse_args()

    xdp_path = Path(args.xdp_file)
    if not xdp_path.exists():
        print(f"Input file not found: {xdp_path}", file=sys.stderr)
        raise SystemExit(1)
    if xdp_path.is_dir():
        print(f"Input must be a file, not a directory: {xdp_path}", file=sys.stderr)
        raise SystemExit(1)
    if xdp_path.suffix.lower() != ".xdp":
        print(f"Input must be a .xdp file: {xdp_path}", file=sys.stderr)
        raise SystemExit(1)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if debug:
        print(f"Input:  {xdp_path.resolve()}")
        print(f"Output: {out_dir.resolve()}")
        if args.overwrite:
            print("Overwrite: enabled")

    _, ok, err = process_one(xdp_path, out_dir, args.overwrite)

    if ok:
        print("Done. ✅ ok")
        raise SystemExit(0)

    if err == "exists":
        print("Done. ⏭️  skipped (output exists). Use --overwrite to replace.")
        raise SystemExit(0)

    print(f"Done. ❌ failed: {err}", file=sys.stderr)
    raise SystemExit(2)


if __name__ == "__main__":
    main()
