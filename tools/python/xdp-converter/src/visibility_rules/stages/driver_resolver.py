import re
from common.rule_model import RawRule, VisibilityRule, VisibilityCondition
from common.condition_parser import ConditionParser


class DriverResolver:
    """
    Resolves which field ('driver') controls each visibility rule.
    Refactored to use a small pipeline:
      1. Parse → 2. Normalize → 3. Contextual Resolve → 4. Emit
    """

    RAWVAL_RE = re.compile(r"([A-Za-z0-9_.]+)\.rawValue")

    def process(self, context):
        print("\n[DriverResolver] Starting...")
        raw_rules = context.get("raw_visibility_rules", [])
        resolved_rules = []
        parent_map = context.get("parent_map")
        xdp_root = context.get("xdp_root")

        for raw in raw_rules:
            resolved_conditions = []

            for script in raw.scripts:
                cond_text = (script.condition or "").strip()
                if not cond_text:
                    continue

                # 1️⃣ Find all "something.rawValue" references
                refs = self.RAWVAL_RE.findall(cond_text)
                if refs:
                    driver = refs[0]  # use the first one
                else:
                    driver = "this"

                # 2️⃣ Resolve 'this' contextually
                if driver.lower() == "this":
                    # Try to locate the element node for context
                    elem = getattr(raw, "element", None)
                    parent = (
                        parent_map.get(elem)
                        if elem is not None and parent_map
                        else None
                    )

                    # Fallback: if no element reference, walk up via xpath text (best effort)
                    if parent is None and parent_map and raw.xpath:
                        for candidate in parent_map.keys():
                            name = candidate.get("name", "")
                            if name and name in raw.xpath:
                                parent = candidate
                                break
                    # Walk upward until we hit a field or exclGroup
                    while parent is not None:
                        if parent.tag.endswith("field") and parent.get("name"):
                            driver = parent.get("name")
                            break
                        if parent.tag.endswith("exclGroup") and parent.get("name"):
                            driver = parent.get("name")
                            break
                        parent = parent_map.get(parent)

                # 3️⃣ Extract operator/value from the expression
                operator = self._extract_operator(cond_text)
                value = self._extract_value(cond_text)

                resolved_conditions.append(
                    VisibilityCondition(driver=driver, operator=operator, value=value)
                )

            if resolved_conditions:
                resolved_rules.append(
                    VisibilityRule(
                        target=raw.target,
                        effect=script.effect,
                        conditions=resolved_conditions,
                        logic="AND",
                        xpath=raw.xpath,
                    )
                )

        context["resolved_visibility_rules"] = resolved_rules
        print(f"[DriverResolver] Resolved {len(resolved_rules)} driver relationships.")
        print("[DriverResolver] Done.\n")
        return context

    # --- helper methods, same as before ---
    def _extract_operator(self, cond: str):
        for op in ["==", "!=", ">=", "<=", ">", "<"]:
            if op in cond:
                return op
        return "=="

    def _extract_value(self, cond: str):
        m = re.search(r"==\s*(['\"]?[A-Za-z0-9_]+['\"]?)", cond)
        if m:
            return m.group(1).strip("'\"")
        return None

    # ---------------------------------------------------------------------
    #  Stage 1: Parse
    # ---------------------------------------------------------------------
    def _parse_condition(self, cond_text: str | None, code: str, raw: RawRule, context):
        text = cond_text or code
        if not text:
            return None, None, None

        atoms = ConditionParser.parse(text)
        if not atoms:
            return None, None, None

        atom = atoms[0]
        driver, operator, value = atom.driver, atom.operator, atom.value

        # Stage 2 → Normalize
        driver = self._normalize_driver_name(driver)

        # Stage 3 → Contextual resolve
        driver = self._resolve_driver_in_context(driver, raw, context)

        return driver, operator, value

    # ---------------------------------------------------------------------
    #  Stage 2: Normalize driver name
    # ---------------------------------------------------------------------
    def _normalize_driver_name(self, driver: str | None) -> str:
        """Clean up purely syntactic artifacts."""
        if not driver:
            return driver
        driver = driver.strip()
        driver = driver.replace(".rawValue", "")
        driver = driver.replace(" ", "")
        return driver

    # ---------------------------------------------------------------------
    #  Stage 3: Resolve driver in context
    # ---------------------------------------------------------------------
    def _resolve_driver_in_context(self, driver: str, raw: RawRule, context) -> str:
        """
        Handle 'this' → actual field name,
        and drop ghost prefixes like 'Header' or 'Partner'
        that aren’t true <field> elements.
        """
        xdp_root = context.get("xdp_root")
        if not xdp_root or not driver:
            return driver

        # --- A) Resolve 'this' ---
        if driver == "this":
            driver = self._resolve_this_driver(raw, context)

        # --- B) Drop ghost prefixes ---
        if "." in driver:
            parts = driver.split(".")
            for i in range(len(parts)):
                candidate = ".".join(parts[i:])
                field_match = xdp_root.find(f".//field[@name='{candidate}']")
                if field_match is not None:
                    return candidate
            # No field found — fallback to last segment
            last = parts[-1]
            return last

        if driver == "this":
            print(f"  [ERROR] could not resolve 'this' for rule {raw.target}")

        return driver

    # ---------------------------------------------------------------------
    #  Support: resolve 'this' using xpath
    # ---------------------------------------------------------------------
    def _resolve_this_driver(self, raw: RawRule, context):
        """
        Replace 'this' with the actual field name if known.
        Walks up the parent map until it finds a <field> node.
        """
        xdp_root = context.get("xdp_root")
        parent_map = context.get("parent_map", {})
        elem = None

        # 1️⃣ Locate the script element by XPath (if possible)
        if xdp_root is not None and raw.xpath:
            try:
                elem = xdp_root.find(raw.xpath)
            except Exception:
                elem = None

        # 2️⃣ If we have a parent_map, walk up until we hit a field
        field_name = None
        current = elem
        while current is not None:
            tag = current.tag.split("}")[-1]  # strip namespaces
            if tag == "field":
                field_name = current.get("name")
                break
            current = parent_map.get(current)

        # 3️⃣ If nothing found, use last segment of target as fallback
        if not field_name and raw.target:
            parts = raw.target.split(".")
            field_name = parts[-1]

        # 4️⃣ Final fallback
        if not field_name:
            print(f"  [WARN] resorting to 'this' for rule {raw.target}")
            field_name = "this"

        return field_name
