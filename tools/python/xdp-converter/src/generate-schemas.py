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
    CTX_XDP_ROOT,
    PipelineContext,
)
from schema_generator.json_schema_generator import JsonSchemaGenerator
from schema_generator.ui_schema_generator import UiSchemaGenerator
import xml.etree.ElementTree as ET
from xdp_parser.factories.enum_map_factory import EnumMapFactory, normalize_enum_labels
from xdp_parser.factories.xdp_element_factory import XdpElementFactory
from xdp_parser.help_text_parser import JSHelpTextParser
from xdp_parser.help_text_registry import HelpTextRegistry
from xdp_parser.parse_context import ParseContext
from xdp_parser.parse_xdp import XdpParser
from xdp_parser.xdp_utils import build_parent_map, strip_namespaces
from visibility_rules.pipeline import VisibilityRulesPipeline


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


def process_one(
    xdp_path: Path, out_dir: Path, overwrite: bool = False, quiet: bool = False
):
    try:
        schema_out, ui_out = output_paths(xdp_path, out_dir)

        if not overwrite and (schema_out.exists() or ui_out.exists()):
            return (xdp_path, False, "exists")

        if not quiet:
            print(f"🧩 Parsing {xdp_path}…")

        # --- Parse XDP and strip namespaces ---
        tree = strip_namespaces(ET.parse(xdp_path))
        root = tree.getroot()

        # --- Build parent map ---
        parent_map = build_parent_map(root)

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
            }
        )

        pipeline_output = pipeline.run(pipeline_context)
        jsonforms_rules = pipeline_output.get(CTX_JSONFORMS_RULES, {})

        top_subforms = set(id(sf) for sf in XdpParser.find_top_subforms(root))
        context = ParseContext(
            root=root,
            parent_map=parent_map,
            radio_groups=normalized_radio_groups,
            help_text=help_text,
            jsonforms_rules=jsonforms_rules,
            top_subforms=top_subforms,
        )

        print(f"Jsonforms rules has {len(jsonforms_rules)} rules")
        print(jsonforms_rules)

        parser = XdpParser(XdpElementFactory(context), context)
        input_groups = parser.parse_xdp()

        # --- Generate schemas ---
        print(f"  [DEBUG] Generating JSON schema from input groups.")
        json_generator = JsonSchemaGenerator()
        json_schema = json_generator.to_schema(input_groups)

        ui_generator = UiSchemaGenerator(input_groups, context)
        print(f"##################.   Generating UI schema from input groups.")
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


def main():
    parser = argparse.ArgumentParser(
        prog="generate_schemas.py",
        description="""Generate JSON and UI schemas from XDP files.

    You can pass individual files, whole directories, or glob patterns.
    For large batches, set --jobs to use multiple workers.

    Examples:
    python3 generate_schemas.py form1.xdp
    python3 generate_schemas.py forms/ -o out/
    python3 generate_schemas.py "forms/**/*.xdp" -j 8 --overwrite
    """,
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="Input XDP files, directories, or glob patterns (e.g., forms/*.xdp).",
    )
    parser.add_argument(
        "-o",
        "--out-dir",
        default=".",
        help="Directory to write outputs (default: current dir).",
    )
    parser.add_argument(
        "-j",
        "--jobs",
        type=int,
        default=os.cpu_count() or 4,
        help="Parallel workers (default: number of CPUs).",
    )
    parser.add_argument(
        "--overwrite", action="store_true", help="Overwrite existing output files."
    )
    parser.add_argument(
        "-q", "--quiet", action="store_true", help="Reduce console output."
    )

    args = parser.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    xdp_files = discover_xdp_files(args.inputs)
    if not xdp_files:
        print("No .xdp files found from the provided inputs.", file=sys.stderr)
        sys.exit(1)

    if not args.quiet:
        print(f"Found {len(xdp_files)} XDP file(s). Writing to: {out_dir.resolve()}")
        print(f"Using {args.jobs} worker(s)…")

    successes = 0
    skipped = 0
    failures = 0

    with ThreadPoolExecutor(max_workers=args.jobs) as ex:
        futures = {
            ex.submit(process_one, xdp, out_dir, args.overwrite, args.quiet): xdp
            for xdp in xdp_files
        }
        for fut in as_completed(futures):
            xdp = futures[fut]
            xdp_short = xdp.name
            ok_path, ok, err = fut.result()
            if ok:
                successes += 1
                if not args.quiet:
                    print(f"✅ {xdp_short}")
            else:
                if err == "exists":
                    skipped += 1
                    if not args.quiet:
                        print(f"⏭️  Skipped (exists): {xdp_short}")
                else:
                    failures += 1
                    print(f"❌ {xdp_short}: {err}", file=sys.stderr)

    if not args.quiet:
        print(f"\nDone. ✅ {successes} ok, ⏭️ {skipped} skipped, ❌ {failures} failed.")

    sys.exit(0 if failures == 0 else 2)


if __name__ == "__main__":
    main()
