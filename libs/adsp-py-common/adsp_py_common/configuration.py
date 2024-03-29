import logging
from operator import attrgetter
from threading import Lock
from typing import Any, Callable, Dict, Optional, Tuple, TypeVar

from cachetools import TTLCache, cachedmethod
from httpx import RequestError, get

from .constants import PLATFORM_CONFIGURATION_API
from .adsp_id import AdspId
from .directory import ServiceDirectory
from .token_provider import TokenProvider


TC = TypeVar("TC")


def _default_convert_config(
    tenant: Dict[str, Any], core: Dict[str, Any]
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    return tenant, core


class ConfigurationService:
    _logger = logging.getLogger("adsp.configuration-service")

    def __init__(
        self,
        directory: ServiceDirectory,
        token_provider: TokenProvider,
        convert_config: Callable[
            [Dict[str, Any], Dict[str, Any]], TC
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
    ) -> TC:
        tenant_config = (
            self._retrieve_configuration(service_id, tenant_id)
            if tenant_id is not None
            else {}
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
            return configuration or {}
        except RequestError as err:
            self._logger.error(
                "Error encountered retrieving configuration for service %s. %s",
                service_id,
                err,
            )
            raise
