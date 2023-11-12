import pytest
from unittest.mock import Mock, patch


from adsp_py_common.access import _TokenIssuer, IssuerCache
from adsp_py_common.configuration import ConfigurationService
from adsp_py_common.directory import ServiceDirectory
from adsp_py_common.event import EventService
from adsp_py_common.tenant import TenantService
from adsp_py_common.token_provider import TokenProvider
from adsp_service_django_sdk import (
    AdspId,
    AdspServices,
    Tenant,
    User,
    get_user,
    get_tenant,
)
from adsp_service_django_sdk.middleware import (
    AccessRequestMiddleware,
    TenantRequestMiddleware,
)
from django.core.exceptions import PermissionDenied

from .request import Request


tenant = Tenant(
    AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
    "test",
    "test_realm",
    "test@test.co",
)
token_issuer = Mock(_TokenIssuer)
token_issuer.tenant = tenant
issuer_cache = Mock(IssuerCache)
services = AdspServices()
services.service_id = AdspId.parse("urn:ads:platform:test-service")
services.directory = Mock(ServiceDirectory)
services.token_provider = Mock(TokenProvider)
services.tenant_service = Mock(TenantService)
services.configuration_service = Mock(ConfigurationService)
services.event_service = Mock(EventService)
services.get_configuration = Mock()
services.issuer_cache = issuer_cache


def test_access_middleware():
    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.decode"
    ) as mock_decode:
        issuer_cache.get_issuer.return_value = token_issuer
        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "Tester",
            "email": "test@test.co",
        }
        get_response = Mock()
        middleware = AccessRequestMiddleware(
            get_response,
            lambda _: "abc123",
        )

        request = Request({}, {})
        middleware(request)
        request_user = get_user(request)
        assert request_user
        assert request_user.tenant == tenant
        assert request_user.id == "tester"
        assert request_user.name == "Tester"
        assert request_user.email == "test@test.co"


def test_access_middleware_no_token():
    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.decode"
    ) as mock_decode:
        issuer_cache.get_issuer.return_value = token_issuer

        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "tester",
            "email": "test@test.co",
        }
        get_response = Mock()
        middleware = AccessRequestMiddleware(get_response)
        request = Request({}, {})
        middleware(request)


def test_access_middleware_unknown_issuer():
    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.decode"
    ) as mock_decode:
        issuer_cache.get_issuer.return_value = None

        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "tester",
            "email": "test@test.co",
        }
        get_response = Mock()
        middleware = AccessRequestMiddleware(
            get_response,
            lambda _: "abc123",
        )
        with pytest.raises(PermissionDenied):
            request = Request({}, {})
            middleware(request)


def test_access_middleware_decode_error():
    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.decode"
    ) as mock_decode:
        issuer_cache.get_issuer.return_value = None

        mock_decode.side_effect = Exception("Oh noes!")
        get_response = Mock()
        middleware = AccessRequestMiddleware(
            get_response,
            lambda _: "abc123",
        )
        with pytest.raises(PermissionDenied):
            request = Request({}, {})
            middleware(request)


def test_access_middleware_map_roles():
    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.decode"
    ) as mock_decode:
        tenant = Tenant(
            AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
            "test",
            "test_realm",
            "test@test.co",
        )
        token_issuer = Mock(_TokenIssuer)
        token_issuer.tenant = tenant
        issuer_cache.get_issuer.return_value = token_issuer

        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "Tester",
            "email": "test@test.co",
            "realm_access": {"roles": ["tester"]},
            "resource_access": {
                "urn:ads:platform:test-service": {"roles": ["service-tester"]},
                "urn:ads:platform:not-test-service": {"roles": ["not-service-tester"]},
            },
        }
        get_response = Mock()
        middleware = AccessRequestMiddleware(
            get_response,
            lambda _: "abc123",
        )
        request = Request({}, {})
        middleware(request)
        request_user = get_user(request)
        assert request_user
        assert "tester" in request_user.roles
        assert "service-tester" in request_user.roles
        assert (
            "urn:ads:platform:not-test-service:not-service-tester" in request_user.roles
        )


def test_tenant_middleware():
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )

    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.get_user",
        Mock(User),
    ) as mock_get_user:
        mock_get_user.return_value = User(
            tenant, "tester", "Tester", "Testy", "McTester", "tester@test.co", [], False
        )
        get_response = Mock()
        middleware = TenantRequestMiddleware(get_response)

        request = Request({}, {})
        middleware(request)
        request_tenant = get_tenant(request)
        assert request_tenant == tenant


def test_tenant_middleware_no_user():
    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.get_user"
    ) as mock_get_user:
        mock_get_user.return_value = None
        get_response = Mock()
        middleware = TenantRequestMiddleware(get_response)

        request = Request({}, {})
        middleware(request)
        request_tenant = get_tenant(request)
        assert not request_tenant


def test_tenant_middleware_core_requested_tenant():
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )

    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.get_user",
        Mock(User),
    ) as mock_get_user, patch(
        "adsp_service_django_sdk._setup.settings",
        ADSP_ACCESS_SERVICE_URL="https://access-service",
        ADSP_DIRECTORY_URL="https://directory",
        ADSP_SERVICE_ID="urn:ads:platform:test-service",
        ADSP_CLIENT_SECRET="abc123",
    ):
        mock_get_user.return_value = User(
            tenant, "tester", "Tester", "Testy", "McTester", "tester@test.co", [], True
        )
        get_response = Mock()
        services.tenant_service.get_tenant.return_value = tenant

        middleware = TenantRequestMiddleware(get_response)

        request = Request({}, {"tenantId": str(tenant.id)})
        middleware(request)
        request_tenant = get_tenant(request)
        assert request_tenant == tenant


def test_tenant_middleware_tenant_request_tenant():
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )
    requested_tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/not-test"),
        "test",
        "test_realm",
        "test@test.co",
    )

    with patch("adsp_service_django_sdk.middleware.adsp", services), patch(
        "adsp_service_django_sdk.middleware.get_user",
        Mock(User),
    ) as mock_get_user:
        mock_get_user.return_value = User(
            tenant, "tester", "Tester", "Testy", "McTester", "tester@test.co", [], False
        )
        get_response = Mock()
        middleware = TenantRequestMiddleware(get_response)

        request = Request({}, {"tenantId": str(requested_tenant.id)})
        middleware(request)
        request_tenant = get_tenant(request)
        assert request_tenant == tenant
