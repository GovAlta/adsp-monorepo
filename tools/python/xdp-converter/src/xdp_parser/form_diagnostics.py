from typing import Dict, List
import re
from xml.etree import ElementTree as ET


class FormDiagnostics:
    """
    Scans parsed XDP visibility rules and reports potential inconsistencies:
      ⚠️ Missing or unknown drivers
      ⚠️ Condition values not found in <items>
      ⚠️ Elements hidden/shown unconditionally
      ✅ Elements with proper conditional logic
    """

    def __init__(self, root: ET.Element, rules_map: Dict[str, object]):
        self.root = root
        self.rules_map = rules_map
        self.field_values = self._collect_field_values()

    # ------------------------------------------------------------------
    def _collect_field_values(self) -> Dict[str, List[str]]:
        """
        Scans <field> elements to collect all possible export values.
        Returns { field_name: [values...] }
        """
        field_values = {}
        for fld in self.root.iter():
            if fld.tag.lower().endswith("field"):
                name = fld.attrib.get("name")
                if not name:
                    continue
                values = []
                for val_node in fld.findall(".//items/value"):
                    if val_node.text:
                        values.append(val_node.text.strip())
                if values:
                    field_values[name] = values
        return field_values

    # ------------------------------------------------------------------
    def diagnose(self) -> list[str]:
        """
        Analyzes all rules in the rules_map (ElementRules objects or JSONForms dicts),
        tags each finding with a category, and prints a summary table.
        Returns the list of messages.
        """
        diags = []
        counters = {
            "missing_field": 0,
            "invalid_value": 0,
            "orphan_rule": 0,
            "always_hidden": 0,
            "always_shown": 0,
            "conditional": 0,
            "info": 0,
        }

        for target, er in self.rules_map.items():
            rules = []

            # --- normalize both input types ---
            if hasattr(er, "rules"):
                rules = er.rules
            elif isinstance(er, dict) and "rule" in er:
                r = er["rule"]
                if isinstance(r, list):
                    for entry in r:
                        rules.append(
                            {
                                "effect": entry.get("effect"),
                                "driver": entry.get("condition", {})
                                .get("scope", "")
                                .split("/")[-1],
                                "condition_value": entry.get("condition", {})
                                .get("schema", {})
                                .get("const"),
                            }
                        )
                else:
                    rules.append(
                        {
                            "effect": r.get("effect"),
                            "driver": r.get("condition", {})
                            .get("scope", "")
                            .split("/")[-1],
                            "condition_value": r.get("condition", {})
                            .get("schema", {})
                            .get("const"),
                        }
                    )

            if not rules:
                continue

            drivers = {
                r.get("driver") if isinstance(r, dict) else getattr(r, "driver", None)
                for r in rules
                if (isinstance(r, dict) and r.get("driver"))
                or getattr(r, "driver", None)
            }
            effects = {
                r.get("effect") if isinstance(r, dict) else getattr(r, "effect", None)
                for r in rules
                if (isinstance(r, dict) and r.get("effect"))
                or getattr(r, "effect", None)
            }

            for r in rules:
                drv = (
                    r.get("driver")
                    if isinstance(r, dict)
                    else getattr(r, "driver", None)
                )
                cond = (
                    r.get("condition_value")
                    if isinstance(r, dict)
                    else getattr(r, "condition_value", None)
                )
                if not drv:
                    continue

                # Skip pseudo-drivers that aren't fields
                if drv.startswith("event__") or drv.lower().startswith("section"):
                    counters["info"] += 1
                    continue

                # Missing driver
                if drv not in self.field_values:
                    diags.append(
                        f"[Missing Field] ⚠️  {target}: references driver '{drv}' not found in form"
                    )
                    counters["missing_field"] += 1
                    continue

                # Invalid trigger value
                val = str(cond).strip(" '\"()")
                val = re.sub(r"^\s*this\.rawValue\s*==\s*", "", val)
                str_items = [str(v) for v in self.field_values.get(drv, [])]
                if val and str(val) not in str_items:
                    diags.append(
                        f"[Invalid Value] ⚠️  {target}: trigger value '{val}' not found in {drv} items {self.field_values[drv]}"
                    )
                    counters["invalid_value"] += 1

            # Visibility pattern analysis
            if effects == {"HIDE"}:
                diags.append(
                    f"[Always Hidden] ⚠️  {target}: hidden unconditionally (never shown)"
                )
                counters["always_hidden"] += 1
            elif effects == {"SHOW"}:
                diags.append(
                    f"[Always Shown] ℹ️  {target}: shown unconditionally (no hide condition)"
                )
                counters["always_shown"] += 1
            elif "SHOW" in effects and "HIDE" in effects:
                diags.append(
                    f"[Conditional] ✅  {target}: conditional visibility (show/hide detected)"
                )
                counters["conditional"] += 1
            else:
                counters["orphan_rule"] += 1
                diags.append(
                    f"[Orphan Rule] ⚙️  {target}: rule exists but has unclear visibility pattern"
                )

        if not diags:
            diags.append("✅  All rules consistent with known fields and values.")

        # --- Summary footer ---
        print("\n".join(diags))
        print("\n" + "-" * 60)
        print("🧾  Diagnostic Summary")
        print(f"  Missing fields : {counters['missing_field']}")
        print(f"  Invalid values : {counters['invalid_value']}")
        print(f"  Orphan rules   : {counters['orphan_rule']}")
        print(f"  Always hidden  : {counters['always_hidden']}")
        print(f"  Always shown   : {counters['always_shown']}")
        print(f"  Conditional    : {counters['conditional']}")
        print(f"  (info/skipped) : {counters['info']}")
        print("-" * 60)

        return diags
