from doctest import debug

debug = False


class JsonFormsEmitter:
    """
    Emits JSONForms-friendly structures for calculated fields.
    """

    def process(self, context):
        consolidated_calcs = context.get("consolidated_calculations", [])
        if debug:
            print("[JsonFormsEmitter] Generating JSONForms schema for calculations...")
        # TODO: output something like {"fieldName": {"calculation": "a + b"}}
        context["output"] = {}
        return context
