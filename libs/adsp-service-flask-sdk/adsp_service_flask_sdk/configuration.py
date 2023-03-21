import logging
from operator import attrgetter
from threading import Lock
from typing import Any, Callable, Dict, Optional

from cachetools import TTLCache, cachedmethod
from httpx import get

from ._constants import PLATFORM_CONFIGURATION_API
from .adsp_id import AdspId
from .directory import ServiceDirectory
from .filter import request_tenant
from .token_provider import TokenProvider


def _default_convert_config(
    tenant: Dict[str, Any], core: Dict[str, Any]
) -> Dict[str, Any]:
    combined: Dict[str, Any] = {}
    if tenant:
        combined.update(tenant)
    if core:
        combined.update(tenant)
    return combined


class ConfigurationService:
    _logger = logging.getLogger("adsp.configuration-service")

    def __init__(
        self,
        directory: ServiceDirectory,
        token_provider: TokenProvider,
        convert_config: Callable[
            [Dict[str, Any], Dict[str, Any]], Dict[str, Any]
        ] = _default_convert_config,
    ) -> None:
        self._cache = TTLCache(100, 900)
        self._cache_lock = Lock()
        self.__directory = directory
        self.__token_provider = token_provider
        self.__convert_config = (
            convert_config if convert_config is not None else _default_convert_config
        )

    def get_configuration(
        self,
        service_id: AdspId,
        tenant_id: Optional[AdspId] = None,
    ) -> Dict[str, Any]:
        tenant_config = (
            self._retrieve_configuration(service_id, tenant_id)
            if tenant_id is not None
            else None
        )
        core_config = self._retrieve_configuration(service_id)
        return self.__convert_config(tenant_config, core_config)

    @cachedmethod(attrgetter("_cache"), lock=attrgetter("_cache_lock"))
    def _retrieve_configuration(
        self, service_id: AdspId, tenant_id: Optional[AdspId] = None
    ) -> Dict[str, Any]:
        try:
            configuration_service_url = self.__directory.get_service_url(
                PLATFORM_CONFIGURATION_API
            )
            token = self.__token_provider.get_access_token()

            params = {}
            if tenant_id is not None:
                params["tenantId"] = str(tenant_id)
            configuration = get(
                f"{configuration_service_url}/configuration/{service_id.namespace}/{service_id.service}/latest",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            ).json()

            self._logger.debug(
                "Configuration retrieved for service %s (tenant: %s).",
                service_id,
                tenant_id,
            )
            return configuration
        except BaseException as err:
            self._logger.error(
                "Error encountered retrieving configuration for service %s. %s",
                service_id,
                err,
            )
            raise


def create_get_configuration(
    configuration_service: ConfigurationService, default_service_id: AdspId
) -> Callable[[Optional[AdspId]], Dict[str, Any]]:
    def get_configuration(
        service_id: Optional[AdspId] = default_service_id,
    ) -> Dict[str, Any]:
        service_id = service_id if service_id is not None else default_service_id
        tenant_id = request_tenant.id if request_tenant else None
        return configuration_service.get_configuration(service_id, tenant_id)

    return get_configuration
