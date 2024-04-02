import logging
from typing import Any, Callable, Dict, Optional, Tuple, TypeVar

from adsp_py_common.access import IssuerCache, User
from adsp_py_common.adsp_id import AdspId
from adsp_py_common.constants import CONTEXT_TENANT, CONTEXT_USER
from adsp_py_common.tenant import Tenant, TenantService
from operator import itemgetter
from flask import globals, Request, request
from jwt import decode
from werkzeug.exceptions import Forbidden, HTTPException, Unauthorized
from werkzeug.local import LocalProxy


def _header_extractor(req: Request) -> Optional[str]:
    auth = req.headers.get("Authorization", type=str)
    return auth[7:] if auth and len(auth) > 7 else None


class AccessRequestFilter:
    _logger = logging.getLogger("adsp.access-request-filter")
    __token_iss_getter = itemgetter("iss")

    def __init__(
        self,
        service_id: AdspId,
        issuer_cache: IssuerCache,
        extractor: Callable[[Request], Optional[str]] = _header_extractor,
    ) -> None:
        self.__service_id = service_id
        self.__issuer_cache = issuer_cache
        self.__extractor = extractor

    def _validate_jwt(
        self, req: Request
    ) -> Tuple[Optional[Tenant], Optional[Dict[str, Any]]]:
        token_value = self.__extractor(req)
        if not token_value:
            return None, None

        try:
            raw = decode(token_value, options={"verify_signature": False})
            iss = self.__token_iss_getter(raw)
            token_issuer = self.__issuer_cache.get_issuer(iss)
            if token_issuer is None:
                raise Unauthorized()

            result = decode(
                token_value,
                token_issuer.jwk_client.get_signing_key_from_jwt(token_value).key,
                algorithms=["RS256", "HS256"],
                audience=str(self.__service_id),
                options={"require": ["exp", "iss", "sub", "aud"]},
            )

            return token_issuer.tenant, result
        except BaseException as err:
            if not isinstance(err, HTTPException):
                self._logger.warning(
                    "Error encountered validating access token. %s", err
                )
                raise Unauthorized()
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

    def filter(self):
        user: Optional[User] = None
        tenant, payload = self._validate_jwt(request)
        if payload:
            user = self._map_claims(tenant, payload)

        request_ctx_proxy: LocalProxy = globals.request_ctx
        request_ctx = request_ctx_proxy._get_current_object()
        setattr(request_ctx, CONTEXT_USER, user)


request_user: Optional[User] = LocalProxy(globals._cv_request, CONTEXT_USER)


class TenantRequestFilter:
    def __init__(self, tenant_service: TenantService) -> None:
        self.__tenant_service = tenant_service

    def filter(self):
        tenant: Optional[Tenant] = None
        if request_user:
            tenant = request_user.tenant
            requested_tenant_id = request.args.get("tenantId")

            if request_user.is_core and requested_tenant_id:
                tenant_id = AdspId.parse(requested_tenant_id)
                tenant = self.__tenant_service.get_tenant(tenant_id)

        request_ctx_proxy: LocalProxy = globals.request_ctx
        request_ctx = request_ctx_proxy._get_current_object()
        setattr(request_ctx, CONTEXT_TENANT, tenant)


request_tenant: Optional[Tenant] = LocalProxy(globals._cv_request, CONTEXT_TENANT)

RT = TypeVar("RT")


def require_user(
    *args: str, allow_core: bool = False
) -> Callable[[Callable[..., RT]], Callable[..., RT]]:
    roles = [role for role in args if role]

    def decorator(func: Callable[..., RT]) -> Callable[..., RT]:
        def wrapper(*args, **kwargs) -> Any:
            user = request_user
            # Note that is None does not work here because user is a LocalProxy
            if not user:
                raise Unauthorized()

            if user.is_core and not allow_core:
                raise Forbidden()

            if roles and not len(list(set(roles) & set(user.roles))):
                raise Forbidden()

            return func(*args, **kwargs)

        # Flask route decorator will complain for duplicate names on wrapped handler functions.
        wrapper.__name__ = func.__name__
        return wrapper

    return decorator
