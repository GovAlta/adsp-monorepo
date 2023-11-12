from typing import Any, Dict


class Request(dict):
    def __init__(self, headers: Dict[str, Any] = None, GET: Dict[str, Any] = None):
        super()
        self.headers = headers
        self.GET = GET

    def __getattr__(self, key):
        return self[key]

    def __setattr__(self, key, value):
        self[key] = value
