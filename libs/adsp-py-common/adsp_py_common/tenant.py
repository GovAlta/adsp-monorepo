import logging
from operator import attrgetter, itemgetter
from threading import Lock
from typing import Dict, NamedTuple, Optional

from cachetools import TTLCache, cachedmethod, keys
from httpx import RequestError, get

from .constants import PLATFORM_TENANT_API
from .adsp_id import AdspId
from .directory import ServiceDirectory
from .token_provider import TokenProvider


class Tenant(NamedTuple):
    id: AdspId
    name: str
    realm: str
    admin_email: str


class TenantService:
    _logger = logging.getLogger("adsp.tenant-service")
    __response_results_getter = itemgetter("results")
    __tenant_values_getter = itemgetter("id", "name", "realm", "adminEmail")

    def __init__(
        self, directory: ServiceDirectory, token_provider: TokenProvider
    ) -> None:
        self._cache = TTLCache(100, 36000)
        self._cache_lock = Lock()
        self.__directory = directory
        self.__token_provider = token_provider

    @cachedmethod(attrgetter("_cache"), lock=attrgetter("_cache_lock"))
    def get_tenant(self, id: AdspId) -> Optional[Tenant]:
        return self.get_tenants().get(str(id), None)

    def get_tenants(self) -> Dict[str, Tenant]:
        try:
            tenant_service_url = self.__directory.get_service_url(
                PLATFORM_TENANT_API
            )
            token = self.__token_provider.get_access_token()
            response = get(
                f"{tenant_service_url}/tenants",
                headers={"Authorization": f"Bearer {token}"},
            ).json()
            results = self.__response_results_getter(response)

            tenants = {}
            for result in results:
                id, name, realm, admin_email = self.__tenant_values_getter(result)
                tenant_id = AdspId.parse(id)
                tenant = Tenant(id, name, realm, admin_email)
                tenants[str(id)] = tenant

                key = keys.methodkey(self, tenant_id)
                with self._cache_lock:
                    self._cache[key] = tenant

                self._logger.debug(
                    "Cached tenant %s -> %s (realm: %s)", tenant_id, name, realm
                )

            self._logger.info("Retrieved and cached tenants.")
            return tenants
        except RequestError as err:
            self._logger.error("Error encountered retrieving tenants. %s", err)
            raise
