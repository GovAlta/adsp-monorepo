from common.script_extractor_base import ScriptExtractorBase


class CalculationScriptExtractor(ScriptExtractorBase):
    """
    Extracts <calculate> scripts describing computed fields.
    """

    def process(self, context):
        xdp_root = context["xdp_root"]
        print("[CalculationScriptExtractor] Extracting calculation scripts...")

        rules_by_target = {}

        for elem, script_text in self._iter_scripts(xdp_root):
            if elem.tag != "calculate":
                continue

            target = self._get_parent_name(elem)
            rule = rules_by_target.setdefault(
                target,
                {
                    "target": target,
                    "scripts": [],
                    "xpath": self._get_xpath(elem),
                },
            )

            rule["scripts"].append(
                {
                    "event": "calculate",
                    "language": elem.get("contentType", "application/x-javascript"),
                    "code": script_text,
                    "type": "calculation",
                }
            )

        context["raw_calculation_rules"] = list(rules_by_target.values())
        return context
