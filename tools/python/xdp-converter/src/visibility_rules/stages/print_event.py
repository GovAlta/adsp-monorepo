from common.rule_model import EventDescription
from visibility_rules.stages.trigger_ast import (
    AtomicCondition,
    CompoundCondition,
    Trigger,
)


#     Trigger: Section2 == 1 || Section2.chkAdditional.rawValue == 1 || Section2.chkEmergency.rawValue == 1
def print_event(event: EventDescription, targets=None):
    trigger = event.trigger
    action = event.action
    metadata = event.metadata
    do_print = targets is None or action.target.lower() in [t.lower() for t in targets]
    if do_print:
        print("[EXTRACTOR EVENT]")
        print(f"    Target: {action.target} -> ({'HIDE' if action.hide else 'SHOW'})")
        print(f"    Action: {'HIDE' if action.hide else 'SHOW'}")
        print(f"    Owner: {metadata.owner} ({metadata.owner_type})")
        print(f"    XPath: {metadata.xpath}")
        print(f"    Trigger: {trigger_to_str(trigger)}")


def trigger_to_str(t: Trigger) -> str:
    n = t.node
    if isinstance(n, AtomicCondition):
        return f"{n.driver} {n.op.value} {_quote_if_needed(n.value)}"
    if isinstance(n, CompoundCondition):
        return f"({trigger_to_str(n.left)} {n.op.value} {trigger_to_str(n.right)})"
    return "<unknown-trigger>"


def _quote_if_needed(v: str) -> str:
    v = v if v is not None else ""
    if v == "":
        return '""'
    if any(ch.isspace() for ch in v):
        return f'"{v}"'
    return v
