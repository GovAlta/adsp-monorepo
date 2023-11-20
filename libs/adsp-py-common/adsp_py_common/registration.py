import logging
from typing import Any, Callable, Dict, List, NamedTuple, Optional

from httpx import RequestError, patch

from .constants import (
    PLATFORM_CONFIGURATION_API,
    PLATFORM_CONFIGURATION_SERVICE,
    PLATFORM_EVENT_SERVICE,
    PLATFORM_FILE_SERVICE,
    PLATFORM_PUSH_SERVICE,
    PLATFORM_TENANT_SERVICE,
)
from .adsp_id import AdspId
from .configuration import TC
from .directory import ServiceDirectory
from .token_provider import TokenProvider


class ConfigurationDefinition(NamedTuple):
    description: str
    schema: Dict[str, Any]
    convert_config: Callable[[Dict[str, Any], Dict[str, Any]], TC] = None


class ServiceRole(NamedTuple):
    role: str
    description: str
    in_tenant_admin: bool = False


class DomainEventDefinition(NamedTuple):
    name: str
    description: str
    payload_schema: Dict[str, Any]


class EventIdentityCriteria(NamedTuple):
    correlationId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class EventIdentity(NamedTuple):
    namespace: str
    name: str
    criteria: Optional[EventIdentityCriteria] = None


class StreamDefinition(NamedTuple):
    id: str
    name: str
    description: str
    public_subscribe: bool = False
    subscriber_roles: List[str] = []
    events: List[EventIdentity] = []


class FileType(NamedTuple):
    id: str
    name: str
    anonymous_read: bool = False
    read_roles: List[str] = []
    update_roles: List[str] = []


class AdspRegistration(NamedTuple):
    display_name: Optional[str] = None
    description: Optional[str] = None
    health_endpoint_path: Optional[str] = None
    docs_endpoint_path: Optional[str] = None
    api_endpoint_path: Optional[str] = None
    configuration: Optional[ConfigurationDefinition] = None
    roles: Optional[List[ServiceRole]] = []
    events: Optional[List[DomainEventDefinition]] = []
    event_streams: Optional[List[StreamDefinition]] = []
    file_types: Optional[List[FileType]] = []


class ServiceRegistrar:
    _logger = logging.getLogger("adsp.service-registrar")

    def __init__(
        self,
        service_id: AdspId,
        directory: ServiceDirectory,
        token_provider: TokenProvider,
    ) -> None:
        self.__service_id = service_id
        self.__directory = directory
        self.__token_provider = token_provider

    def register(self, registration: AdspRegistration) -> None:
        if registration.configuration:
            self._updated_service_configuration(
                PLATFORM_CONFIGURATION_SERVICE,
                {
                    f"{self.__service_id.namespace}:{self.__service_id.service}": {
                        "description": registration.configuration.description,
                        "configurationSchema": registration.configuration.schema,
                    }
                },
            )

        if registration.roles:
            self._updated_service_configuration(
                PLATFORM_TENANT_SERVICE,
                {
                    str(self.__service_id): {
                        "roles": [
                            {
                                "role": role.role,
                                "description": role.description,
                                "inTenantAdmin": role.in_tenant_admin,
                            }
                            for role in registration.roles
                        ]
                    }
                },
            )

        if registration.events:
            self._updated_service_configuration(
                PLATFORM_EVENT_SERVICE,
                {
                    self.__service_id.service: {
                        "name": self.__service_id.service,
                        "definitions": {
                            event.name: {
                                "name": event.name,
                                "description": event.description,
                                "payloadSchema": event.payload_schema,
                            }
                            for event in registration.events
                        },
                    }
                },
            )

        if registration.event_streams:
            self._updated_service_configuration(
                PLATFORM_PUSH_SERVICE,
                {
                    stream.id: {
                        "id": stream.id,
                        "name": stream.name,
                        "description": stream.description,
                        "events": stream.events,
                        "subscriberRoles": stream.subscriber_roles,
                        "publicSubscribe": stream.public_subscribe,
                    }
                    for stream in registration.event_streams
                },
            )

        if registration.file_types:
            self._updated_service_configuration(
                PLATFORM_FILE_SERVICE,
                {
                    file_type.id: {
                        "id": file_type.id,
                        "name": file_type.name,
                        "anonymousRead": file_type.anonymous_read,
                        "readRoles": file_type.read_roles,
                        "updateRoles": file_type.update_roles,
                    }
                    for file_type in registration.file_types
                },
            )

    def _updated_service_configuration(
        self, service_id: AdspId, update: Dict[str, Any]
    ):
        configuration_service_url = self.__directory.get_service_url(
            PLATFORM_CONFIGURATION_API
        )
        token = self.__token_provider.get_access_token()

        try:
            response = patch(
                f"{configuration_service_url}/configuration/{service_id.namespace}/{service_id.service}",
                json={"operation": "UPDATE", "update": update},
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 200:
                self._logger.info(
                    "Updated registration configuration for service %s", service_id
                )
            else:
                self._logger.error(
                    "Error encountered updating registration configuration for service %s. %s",
                    service_id,
                    response.content.decode(),
                )
        except RequestError as err:
            self._logger.error(
                "Error encountered updating registration configuration for service %s. %s",
                service_id,
                err,
            )
            raise
