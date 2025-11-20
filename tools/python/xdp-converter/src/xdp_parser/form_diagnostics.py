from typing import Dict, List, Tuple
import re
from xml.etree import ElementTree as ET
from xdp_parser.xdp_utils import tag_name


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
        self.known_fields_full, self.known_fields_leaf = self._collect_known_fields()

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
    def _collect_known_fields(self) -> Tuple[set[str], set[str]]:
        """
        Collects all form control names (fields, radio groups, subforms containing fields).
        Returns both full and leaf-name sets.
        """
        full, leaf = set(), set()

        def add(name: str):
            if not name:
                return
            full.add(name)
            leaf.add(name.split(".")[-1])

        for el in self.root.iter():
            t = tag_name(el.tag).lower()

            # Regular fields
            if t == "field":
                add(el.attrib.get("name"))

            # Radio groups (exclGroup)
            elif t == "exclgroup":
                group_name = el.attrib.get("name")
                if group_name:
                    add(group_name)
                for f in el.findall(".//field"):
                    add(f.attrib.get("name"))

            # Subforms containing inputs
            elif t == "subform" and el.attrib.get("name"):
                if any(
                    tag_name(c.tag).lower() in {"field", "exclgroup"} for c in el.iter()
                ):
                    add(el.attrib["name"])

        print(f"[Diagnostics] Found {len(full)} known controls")
        return full, leaf

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

            # normalize both input types
            if hasattr(er, "rules"):
                rules = er.rules
            elif isinstance(er, dict) and "rule" in er:
                r = er["rule"]
                if isinstance(r, list):
                    for entry in r:
                        rules.append(
                            {
                                "effect": entry.get("effect"),
                                "driver": entry.get("driver"),
                                "condition_value": entry.get("condition", {})
                                .get("schema", {})
                                .get("const"),
                            }
                        )
                else:
                    rules.append(
                        {
                            "effect": r.get("effect"),
                            "driver": r.get("driver"),
                            "condition_value": r.get("condition", {})
                            .get("schema", {})
                            .get("const"),
                        }
                    )

            if not rules:
                continue

            drivers = {r.get("driver") for r in rules if r.get("driver")}
            effects = {r.get("effect") for r in rules if r.get("effect")}

            # --- driver validation ---
            for r in rules:
                drv = r.get("driver")
                cond = r.get("condition_value")
                if not drv:
                    continue

                # Skip pseudo-drivers that aren't fields
                if drv.startswith("event__") or drv.lower().startswith("section"):
                    counters["info"] += 1
                    continue

                # Missing driver
                if (
                    drv not in self.known_fields_full
                    and drv not in self.known_fields_leaf
                ):
                    diags.append(
                        f"[Missing Field] ⚠️  {target}: references driver '{drv}' not found in form"
                    )
                    counters["missing_field"] += 1
                    continue

                # Invalid trigger value
                val = str(cond).strip(" '\"()")
                val = re.sub(r"^\s*this\.rawValue\s*==\s*", "", val)
                valid_items = self.field_values.get(drv, [])
                if (
                    val
                    and valid_items
                    and str(val) not in [str(v) for v in valid_items]
                ):
                    diags.append(
                        f"[Invalid Value] ⚠️  {target}: trigger value '{val}' not in {drv} items {valid_items}"
                    )
                    counters["invalid_value"] += 1

            # --- enhanced visibility classifier ---
            show_rules = [r for r in rules if r.get("effect") == "SHOW"]
            hide_rules = [r for r in rules if r.get("effect") == "HIDE"]

            show_drivers = {r.get("driver") for r in show_rules}
            hide_drivers = {r.get("driver") for r in hide_rules}

            # Detect implicit conditionals (same driver toggled in another section)
            implicit_conditional = False
            if not hide_rules and len(show_rules) == 1:
                drv = show_rules[0].get("driver")
                const_val = show_rules[0].get("condition_value")
                # scan all other targets for same driver with different value
                for other_target, other_er in self.rules_map.items():
                    if other_target == target:
                        continue
                    other_rules = []
                    if hasattr(other_er, "rules"):
                        other_rules = other_er.rules
                    elif isinstance(other_er, dict) and "rule" in other_er:
                        orule = other_er["rule"]
                        other_rules = orule if isinstance(orule, list) else [orule]

                    for rr in other_rules:
                        odrv = (
                            rr.get("driver")
                            if isinstance(rr, dict)
                            else getattr(rr, "driver", None)
                        )
                        oconst = (
                            rr.get("condition", {}).get("schema", {}).get("const")
                            if isinstance(rr, dict)
                            else getattr(rr, "condition_value", None)
                        )
                        if odrv == drv and oconst != const_val:
                            implicit_conditional = True
                            break
                    if implicit_conditional:
                        break

            # classify
            if (show_drivers & hide_drivers) or implicit_conditional:
                diags.append(
                    f"[Conditional] ✅  {target}: conditional visibility (show/hide or implicit toggle detected)"
                )
                counters["conditional"] += 1
            elif effects == {"HIDE"}:
                diags.append(f"[Always Hidden] ⚠️  {target}: hidden unconditionally")
                counters["always_hidden"] += 1
            elif effects == {"SHOW"}:
                diags.append(f"[Always Shown] ℹ️  {target}: shown unconditionally")
                counters["always_shown"] += 1
            else:
                diags.append(
                    f"[Orphan Rule] ⚙️  {target}: rule exists but unclear visibility pattern"
                )
                counters["orphan_rule"] += 1

        if not diags:
            diags.append("✅  All rules consistent with known fields and values.")

        # --- summary footer ---
        print("\n".join(diags))
        print("\n" + "-" * 60)
        print("🧾  Diagnostic Summary")
        for k, v in [
            ("Missing fields", "missing_field"),
            ("Invalid values", "invalid_value"),
            ("Orphan rules", "orphan_rule"),
            ("Always hidden", "always_hidden"),
            ("Always shown", "always_shown"),
            ("Conditional", "conditional"),
            ("(info/skipped)", "info"),
        ]:
            print(f"  {k:15s}: {counters[v]}")
        print("-" * 60)

        return diags
