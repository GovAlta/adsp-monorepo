from typing import Optional

from urnparse import URN8141, NSIdentifier, NSSString

from .util import destruct_list


class AdspId:
    nid = NSIdentifier("ads")

    def __init__(
        self,
        namespace: str,
        service: Optional[str] = None,
        api: Optional[str] = None,
        resource: Optional[str] = None,
    ) -> None:
        self.namespace = namespace
        self.service = service
        self.api = api
        self.resource = resource
        self.nss = NSSString(
            namespace
            + f'{f":{service}" if service else ""}{f":{api}" if api else ""}{f":{resource}" if resource else ""}'
        )

    def __repr__(self) -> str:
        return str(URN8141(self.nid, self.nss, ""))

    def __eq__(self, other):
        return isinstance(other, AdspId) and str(self) == str(other)

    def __hash__(self):
        return hash((self.namespace, self.service, self.api, self.resource))

    @staticmethod
    def parse(urn_string: str):
        urn = URN8141.from_string(urn_string)
        namespace, service, api, resource = destruct_list(4, urn.specific_string.parts)
        return AdspId(namespace, service, api, resource)
