import sys
import os
import json
from xml.etree import ElementTree as ET

from visibility_rules.pipeline import VisibilityRulesPipeline
from calculations.pipeline import CalculationRulesPipeline
from dataclasses import asdict, is_dataclass

from xdp_parser.xdp_utils import build_parent_map, strip_namespaces


def load_xdp_file(path: str):
    """
    Load an XDP file and return the ElementTree root.
    Assumes namespaces are already stripped by your loader.
    """
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        sys.exit(1)

    try:
        tree = strip_namespaces(ET.parse(path))
        return tree.getroot()
    except ET.ParseError as e:
        print(f"❌ Failed to parse XDP: {e}")
        sys.exit(1)


def ensure_output_dir():
    out_dir = os.path.join(os.getcwd(), "schemas")
    os.makedirs(out_dir, exist_ok=True)
    return out_dir


def _to_serializable(obj):
    if is_dataclass(obj):
        return asdict(obj)
    elif isinstance(obj, list):
        return [_to_serializable(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: _to_serializable(v) for k, v in obj.items()}
    else:
        return obj


def save_output(data, xdp_path, mode, overwrite=True):
    """
    Save the pipeline output to /output/<basename>_<mode>.json
    """
    out_dir = ensure_output_dir()
    base = os.path.splitext(os.path.basename(xdp_path))[0]
    filename = f"{base}_{mode}.json"
    out_path = os.path.join(out_dir, filename)

    if not overwrite and os.path.exists(out_path):
        print(f"⚠️  Skipping save (file exists): {out_path}")
        return

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(_to_serializable(data) or {}, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Output saved to: {out_path}")


def run_pipeline_test(xdp_path: str, mode: str, overwrite=True):
    print(f"=== Running pipeline test ({mode}) ===")

    xdp_root = load_xdp_file(xdp_path)

    # 💡 Add enum mappings (these get passed to the pipeline)
    enum_maps = {"rbApplicant": {"1": "Adult", "2": "Child"}}
    parent_map = build_parent_map(xdp_root)

    context = {
        "xdp_root": xdp_root,
        "parent_map": parent_map,
        "extra_context": enum_maps,
    }

    if mode == "visibility":
        pipeline = VisibilityRulesPipeline()
    elif mode == "calculation":
        pipeline = CalculationRulesPipeline()
    else:
        print(f"❌ Unknown mode '{mode}'. Use 'visibility' or 'calculation'.")
        sys.exit(1)

    # 👉 Run the pipeline, injecting the extra context
    output = pipeline.run(context)

    print("\n=== JSONForms-style output ===")
    print(json.dumps(output, indent=2, ensure_ascii=False) if output else "{}")

    save_output(output, xdp_path, mode, overwrite)

    print("\n✅ Test completed successfully.")


def print_usage():
    print("Usage:")
    print(
        "  python test_pipeline.py <path-to-xdp> [visibility|calculation] [--no-overwrite]"
    )
    print("Examples:")
    print("  python test_pipeline.py samples/visibility_example.xdp visibility")
    print(
        "  python test_pipeline.py samples/calc_example.xdp calculation --no-overwrite"
    )


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print_usage()
        sys.exit(1)

    xdp_path = sys.argv[1]
    mode = sys.argv[2].lower()
    overwrite = "--no-overwrite" not in sys.argv

    run_pipeline_test(xdp_path, mode, overwrite)
