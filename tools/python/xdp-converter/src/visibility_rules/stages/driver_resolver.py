import re
from common.rule_model import RawRule, VisibilityRule, VisibilityCondition
from common.condition_parser import ConditionParser
from constants import CTX_PARENT_MAP, CTX_RAW_RULES, CTX_RESOLVED_RULES


class DriverResolver:
    """
    Resolves which field ('driver') controls each visibility rule.
    Refactored to use a small pipeline:
      1. Parse → 2. Normalize → 3. Contextual Resolve → 4. Emit
    """

    RAWVAL_RE = re.compile(r"([A-Za-z0-9_.]+)\.rawValue")

    def process(self, context):
        print("\n[DriverResolver] Starting...")

        raw_rules = context.get(CTX_RAW_RULES, [])
        resolved_rules = []
        parent_map = context.get(CTX_PARENT_MAP, {})

        for raw in raw_rules:
            resolved_conditions = []

            for script in raw.scripts:
                cond_text = (script.condition or "").strip()
                if not cond_text:
                    continue

                # 1️⃣ Extract something.rawValue
                refs = self.RAWVAL_RE.findall(cond_text)
                if refs:
                    driver = refs[0]
                else:
                    driver = "this"

                # 2️⃣ Resolve 'this'
                if driver.lower() == "this":
                    elem = getattr(raw, "element", None)
                    parent = parent_map.get(elem) if elem is not None else None

                    # Walk upward until we hit a field or exclGroup
                    while parent is not None:
                        tag = parent.tag.split("}")[-1]
                        if tag in ("field", "exclGroup"):
                            name = parent.get("name")
                            if name:
                                driver = name
                                break
                        parent = parent_map.get(parent)

                # 3️⃣ Simplified prefix removal (fix for Section2.*, Form1.*, etc)
                if "." in driver:
                    driver = driver.split(".")[-1]

                # 4️⃣ Extract operator and value
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

        context[CTX_RESOLVED_RULES] = resolved_rules
        print(f"[DriverResolver] Resolved {resolved_rules} driver relationships.")
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
        Normalize 'this', drop any prefix scopes (Section2.*, Parent.Subform.*, etc),
        and return the real field name.
        """

        # Normalize purely syntactic artefacts
        driver = self._normalize_driver_name(driver)

        # Resolve 'this' if necessary (DriverResolver.process already handles this)
        if driver == "this":
            return "this"

        # Drop any prefixes (Section2.cboMinistry -> cboMinistry)
        if "." in driver:
            driver = driver.split(".")[-1]

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
