import json
import logging
from operator import attrgetter, itemgetter
from threading import Lock
from typing import Any, Dict, List, NamedTuple, Optional
from urllib.error import URLError
from urllib.request import Request, urlopen

from cachetools import cachedmethod, keys, TTLCache
from httpx import RequestError, get
from jwt import PyJWKClient, PyJWKClientError

from .tenant import Tenant, TenantService


class _JWKClient(PyJWKClient):
    # This is necessary because the base implementation includes the default User-Agent for Python.
    def fetch_data(self) -> Any:
        jwk_set: Any = None
        try:
            with urlopen(Request(self.uri, headers={"User-Agent": ""})) as response:
                jwk_set = json.load(response)
        except URLError as e:
            raise PyJWKClientError(f'Fail to fetch data from the url, err: "{e}"')
        else:
            return jwk_set
        finally:
            if self.jwk_set_cache is not None:
                self.jwk_set_cache.put(jwk_set)


class _TokenIssuer(NamedTuple):
    tenant: Optional[Tenant]
    iss: str
    jwk_client: PyJWKClient


class IssuerCache:
    _logger = logging.getLogger("adsp.issuer-cache")
    __metadata_values_getter = itemgetter("issuer", "jwks_uri")

    def __init__(
        self,
        access_service_url: str,
        tenant_service: TenantService,
        allow_core: bool = False,
    ) -> None:
        self._cache = TTLCache(100, 36000)
        self._cache_lock = Lock()
        self.__access_service_url = access_service_url
        self.__tenant_service = tenant_service
        self.__allow_core = allow_core

    def _retrieve_issuers(self) -> Dict[str, _TokenIssuer]:
        try:
            tenants = self.__tenant_service.get_tenants()

            issuers = {}
            if self.__allow_core:
                core_iss = f"{self.__access_service_url}/auth/realms/core"
                core_jwks_uri = f"{self.__access_service_url}/auth/realms/core/protocol/openid-connect/certs"
                issuers[core_iss] = _TokenIssuer(
                    None, core_iss, _JWKClient(core_jwks_uri)
                )
                self._logger.debug("Including core issuer %s -> core", core_iss)

            for _, tenant in tenants.items():
                try:
                    metadata = get(
                        f"{self.__access_service_url}/auth/realms/{tenant.realm}/.well-known/openid-configuration"
                    ).json()
                    iss, jwks_uri = self.__metadata_values_getter(metadata)

                    issuer = _TokenIssuer(tenant, iss, _JWKClient(jwks_uri))
                    issuers[iss] = issuer

                    key = keys.methodkey(self, iss)
                    with self._cache_lock:
                        self._cache[key] = issuer

                    self._logger.debug(
                        "Cached issuer %s -> %s (%s)", iss, tenant.name, tenant.realm
                    )
                except Exception as err:
                    self._logger.warning(
                        "Error encountered resolving issuer for tenant %s (realm: %s). %s",
                        tenant.name,
                        tenant.realm,
                        err,
                    )

            self._logger.info("Retrieved and cached tenant issuers.")
            return issuers
        except RequestError as err:
            self._logger.error("Error encountered retrieving issuers. %s", err)
            raise

    @cachedmethod(attrgetter("_cache"), lock=attrgetter("_cache_lock"))
    def get_issuer(self, iss: str) -> Optional[_TokenIssuer]:
        return self._retrieve_issuers().get(iss, None)


class User(NamedTuple):
    tenant: Optional[Tenant]
    id: str
    name: str
    first_name: str
    last_name: str
    email: str
    roles: List[str]
    is_core: bool = False
