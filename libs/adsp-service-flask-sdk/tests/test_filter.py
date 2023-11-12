import pytest
from unittest.mock import Mock, patch


from adsp_py_common.access import _TokenIssuer, IssuerCache
from adsp_py_common.tenant import TenantService
from adsp_service_flask_sdk import (
    AdspId,
    Tenant,
    User,
    request_tenant,
    request_user,
    require_user,
)
from adsp_service_flask_sdk.filter import AccessRequestFilter, TenantRequestFilter
from flask import Flask
from werkzeug.exceptions import Forbidden, Unauthorized


def test_access_filter():
    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.decode"
    ) as mock_decode, app.test_request_context():
        tenant = Tenant(
            AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
            "test",
            "test_realm",
            "test@test.co",
        )
        token_issuer = Mock(_TokenIssuer)
        token_issuer.tenant = tenant
        issuer_cache = Mock(IssuerCache)
        issuer_cache.get_issuer.return_value = token_issuer

        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "Tester",
            "email": "test@test.co",
        }
        filter = AccessRequestFilter(
            AdspId.parse("urn:ads:platform:test-service"),
            issuer_cache,
            lambda _: "abc123",
        )
        filter.filter()
        assert request_user
        assert request_user.tenant == tenant
        assert request_user.id == "tester"
        assert request_user.name == "Tester"
        assert request_user.email == "test@test.co"


def test_access_filter_no_token():
    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.decode"
    ) as mock_decode, app.test_request_context():
        token_issuer = Mock(_TokenIssuer)
        issuer_cache = Mock(IssuerCache)
        issuer_cache.get_issuer.return_value = token_issuer

        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "tester",
            "email": "test@test.co",
        }
        filter = AccessRequestFilter(
            AdspId.parse("urn:ads:platform:test-service"),
            issuer_cache,
        )
        filter.filter()


def test_access_filter_unknown_issuer():
    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.decode"
    ) as mock_decode, app.test_request_context():
        issuer_cache = Mock(IssuerCache)
        issuer_cache.get_issuer.return_value = None

        mock_decode.return_value = {
            "iss": "https://access-service/auth/realms/test",
            "sub": "tester",
            "preferred_username": "tester",
            "email": "test@test.co",
        }
        filter = AccessRequestFilter(
            AdspId.parse("urn:ads:platform:test-service"),
            issuer_cache,
            lambda _: "abc123",
        )
        with pytest.raises(Unauthorized):
            filter.filter()


def test_access_filter_decode_error():
    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.decode"
    ) as mock_decode, app.test_request_context():
        issuer_cache = Mock(IssuerCache)
        issuer_cache.get_issuer.return_value = None

        mock_decode.side_effect = Exception("Oh noes!")
        filter = AccessRequestFilter(
            AdspId.parse("urn:ads:platform:test-service"),
            issuer_cache,
            lambda _: "abc123",
        )
        with pytest.raises(Unauthorized):
            filter.filter()


def test_access_filter_map_roles():
    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.decode"
    ) as mock_decode, app.test_request_context():
        tenant = Tenant(
            AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
            "test",
            "test_realm",
            "test@test.co",
        )
        token_issuer = Mock(_TokenIssuer)
        token_issuer.tenant = tenant
        issuer_cache = Mock(IssuerCache)
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
        filter = AccessRequestFilter(
            AdspId.parse("urn:ads:platform:test-service"),
            issuer_cache,
            lambda _: "abc123",
        )
        filter.filter()
        assert request_user
        assert "tester" in request_user.roles
        assert "service-tester" in request_user.roles
        assert (
            "urn:ads:platform:not-test-service:not-service-tester" in request_user.roles
        )


def test_tenant_filter():
    app = Flask(__name__)
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )

    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context():
        mock_user.tenant = tenant
        mock_user.is_core = False
        tenant_service = Mock(TenantService)
        filter = TenantRequestFilter(tenant_service)
        filter.filter()
        assert request_tenant == tenant


def test_tenant_filter_no_user():
    app = Flask(__name__)

    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        None,
    ), app.test_request_context():
        tenant_service = Mock(TenantService)
        filter = TenantRequestFilter(tenant_service)
        filter.filter()
        assert not request_tenant


def test_tenant_filter_core_requested_tenant():
    app = Flask(__name__)
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )

    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context() as ctx:
        ctx.request.args = {"tenantId": str(tenant.id)}
        mock_user.is_core = True
        tenant_service = Mock(TenantService)
        tenant_service.get_tenant.return_value = tenant

        filter = TenantRequestFilter(tenant_service)
        filter.filter()
        assert request_tenant == tenant


def test_tenant_filter_tenant_request_tenant():
    app = Flask(__name__)
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

    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context() as ctx:
        ctx.request.args = {"tenantId": str(requested_tenant.id)}
        mock_user.tenant = tenant
        mock_user.is_core = False
        tenant_service = Mock(TenantService)
        filter = TenantRequestFilter(tenant_service)
        filter.filter()
        assert request_tenant == tenant


def test_require_user():
    @require_user()
    def method():
        return "testing 123"

    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context():
        mock_user.is_core = False
        method()


def test_require_user_no_user():
    @require_user()
    def method():
        return "testing 123"

    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        None,
    ), app.test_request_context(), pytest.raises(Unauthorized):
        method()


def test_require_user_core_not_allowed():
    @require_user()
    def method():
        return "testing 123"

    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context(), pytest.raises(Forbidden):
        mock_user.is_core = True
        method()


def test_require_user_core_allowed():
    @require_user(allow_core=True)
    def method():
        return "testing 123"

    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context():
        mock_user.is_core = True
        method()


def test_require_user_with_role():
    @require_user("tester")
    def method():
        return "testing 123"

    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context():
        mock_user.is_core = False
        mock_user.roles = ["tester"]
        method()


def test_require_user_without_role():
    @require_user("tester")
    def method():
        return "testing 123"

    app = Flask(__name__)
    with patch(
        "adsp_service_flask_sdk.filter.request_user",
        Mock(User),
    ) as mock_user, app.test_request_context(), pytest.raises(Forbidden):
        mock_user.is_core = False
        mock_user.roles = []
        method()
