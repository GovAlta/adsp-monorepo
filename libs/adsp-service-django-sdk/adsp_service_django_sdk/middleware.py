import logging
from typing import Any, Callable, Dict, Optional, Tuple

from adsp_py_common.access import User
from adsp_py_common.adsp_id import AdspId
from adsp_py_common.constants import CONTEXT_USER, CONTEXT_TENANT
from adsp_py_common.tenant import Tenant
from django.core.exceptions import PermissionDenied
from jwt import decode
from operator import itemgetter

from ._setup import adsp
from .context import get_user


def _header_extractor(req) -> Optional[str]:
    auth = req.headers.get("Authorization")
    return auth[7:] if auth and len(auth) > 7 else None


class AccessRequestMiddleware:
    _logger = logging.getLogger("adsp.access-request-filter")
    __token_iss_getter = itemgetter("iss")

    def __init__(
        self,
        get_response,
        extractor: Callable[[Any], Optional[str]] = _header_extractor,
    ) -> None:
        self._get_response = get_response
        self.__service_id = adsp.service_id
        self.__issuer_cache = adsp.issuer_cache
        self.__extractor = extractor

    def _validate_jwt(self, req) -> Tuple[Optional[Tenant], Optional[Dict[str, Any]]]:
        token_value = self.__extractor(req)
        if not token_value:
            return None, None

        try:
            raw = decode(token_value, options={"verify_signature": False})
            iss = self.__token_iss_getter(raw)
            token_issuer = self.__issuer_cache.get_issuer(iss)
            if token_issuer is None:
                raise PermissionDenied()

            result = decode(
                token_value,
                token_issuer.jwk_client.get_signing_key_from_jwt(token_value).key,
                algorithms=["RS256", "HS256"],
                audience=str(self.__service_id),
                options={"require": ["exp", "iss", "sub", "aud"]},
            )

            return token_issuer.tenant, result
        except BaseException as err:
            if not isinstance(err, PermissionDenied):
                self._logger.warning(
                    "Error encountered validating access token. %s", err
                )
                raise PermissionDenied()
            raise

    def _map_claims(self, tenant: Optional[Tenant], payload: Dict[str, Any]) -> User:
        roles = payload.get("realm_access", {}).get("roles", [])

        service_id = str(self.__service_id)
        for client, client_details in payload.get("resource_access", {}).items():
            client_roles = client_details.get("roles", [])
            service_roles = (
                [f"{client}:{cr}" for cr in client_roles]
                if client != service_id
                else [cr for cr in client_roles]
            )
            roles.extend(service_roles)

        return User(
            tenant,
            payload.get("sub"),
            payload.get("preferred_username"),
            payload.get("given_name", None),
            payload.get("family_name", None),
            payload.get("email", None),
            roles,
            tenant is None,
        )

    def __call__(self, request):
        user: Optional[User] = None
        tenant, payload = self._validate_jwt(request)
        if payload:
            user = self._map_claims(tenant, payload)

        setattr(request, CONTEXT_USER, user)
        return self._get_response(request)


class TenantRequestMiddleware:
    def __init__(self, get_response) -> None:
        self._get_response = get_response
        self.__tenant_service = adsp.tenant_service

    def __call__(self, request):
        tenant: Optional[Tenant] = None
        request_user = get_user(request)
        if request_user:
            tenant = request_user.tenant
            requested_tenant_id = request.GET.get("tenantId")

            if request_user.is_core and requested_tenant_id:
                tenant_id = AdspId.parse(requested_tenant_id)
                tenant = self.__tenant_service.get_tenant(tenant_id)

        setattr(request, CONTEXT_TENANT, tenant)
        return self._get_response(request)
