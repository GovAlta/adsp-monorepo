# debug_log.py
from typing import Callable, Any


class DebugLog:
    """
    Lightweight opt-in logger.
    Usage:
        log = DebugLog(enabled=True)    # or False in prod
        log("Label", field=fname, source=src, value=label)
    """

    def __init__(self, enabled: bool = False, sink: Callable[[str], Any] | None = None):
        self.enabled = enabled
        self.sink = sink or print

    def __call__(self, *msg_parts, **kv):
        if not self.enabled:
            return
        head = " ".join(str(m) for m in msg_parts) if msg_parts else ""
        tail = " ".join(f"{k}={kv[k]!r}" for k in kv)
        line = (head + " " + tail).strip()
        self.sink(line)

    def child(self, **defaults):
        """
        Partially apply some default key/vals, returns a callable.
        """

        def _inner(*msg_parts, **kv):
            merged = {**defaults, **kv}
            self(*msg_parts, **merged)

        return _inner
