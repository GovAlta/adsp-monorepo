from datetime import datetime
import logging
from typing import Any, Dict, NamedTuple, Optional

from httpx import RequestError, post

from .constants import PLATFORM_EVENT_API
from .adsp_id import AdspId
from .directory import ServiceDirectory
from .registration import AdspRegistration
from .token_provider import TokenProvider


class DomainEvent(NamedTuple):
    name: str
    timestamp: datetime
    payload: Dict[str, Any]
    correlation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class EventService:
    _logger = logging.getLogger("adsp.event-service")

    def __init__(
        self,
        service_id: AdspId,
        directory: ServiceDirectory,
        token_provider: TokenProvider,
        registration: AdspRegistration,
    ) -> None:
        self.__namespace = service_id.service
        self.__directory = directory
        self.__token_provider = token_provider
        self.__events = [event.name for event in (registration.events or [])]

    def send(self, event: DomainEvent) -> None:
        if event.name not in self.__events:
            raise ValueError(f"Event '{event.name}' is not registered for the service.")
        try:
            event_service_url = self.__directory.get_service_url(PLATFORM_EVENT_API)
            token = self.__token_provider.get_access_token()

            name, timestamp, payload, correlation_id, context = event
            post(
                f"{event_service_url}/events",
                json={
                    "namespace": self.__namespace,
                    "name": name,
                    "timestamp": timestamp.isoformat(),
                    "correlation_id": correlation_id,
                    "context": context,
                    "payload": payload,
                },
                headers={"Authorization": f"Bearer {token}"},
            )
        except RequestError as err:
            self._logger.error(
                "Error encountered sending domain event %s:%s. %s",
                self.__namespace,
                event.name,
                err,
            )
