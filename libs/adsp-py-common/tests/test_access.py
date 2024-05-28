from unittest.mock import Mock, patch

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.access import IssuerCache
from adsp_py_common.tenant import Tenant, TenantService
from httpx import Response, RequestError

tenant_id = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test")


def test_get_issuer():
    with patch("adsp_py_common.access.get") as mock_get:
        iss = "https://access-service/auth/realms/test_realm"
        tenant_id = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test")
        tenant_service = Mock(TenantService)
        tenant_service.get_tenants.return_value = {
            tenant_id: Tenant(
                tenant_id,
                "test",
                "test_realm",
                "test@test.co",
            )
        }
        cache = IssuerCache("https://access-service", tenant_service)

        response = Mock(Response)
        response.json.return_value = {
            "issuer": iss,
            "jwks_uri": "https://access-service/auth/realms/test_realm/certs",
        }
        mock_get.return_value = response
        issuer = cache.get_issuer(iss)
        assert issuer
        assert issuer.iss == iss


def test_get_issuer_allow_core():
    with patch("adsp_py_common.access.get") as mock_get:
        iss = "https://access-service/auth/realms/core"
        tenant_service = Mock(TenantService)
        tenant_service.get_tenants.return_value = {}
        cache = IssuerCache("https://access-service", tenant_service, True)

        response = Mock(Response)
        response.json.return_value = {
            "issuer": iss,
            "jwks_uri": "https://access-service/auth/realms/core/certs",
        }
        mock_get.return_value = response
        issuer = cache.get_issuer(iss)
        assert issuer
        assert issuer.iss == iss


def test_get_issuer_request_error():
    missing_tenant_id = AdspId.parse(
        "urn:ads:platform:tenant-service:v2:/tenants/test2"
    )
    with patch("adsp_py_common.access.get") as mock_get:
        iss = "https://access-service/auth/realms/core"
        tenant_service = Mock(TenantService)
        tenant_service.get_tenants.return_value = {
            tenant_id: Tenant(
                tenant_id,
                "test",
                "test_realm",
                "test@test.co",
            ),
            missing_tenant_id: Tenant(
                missing_tenant_id,
                "test2",
                "test_realm",
                "test@test.co",
            ),
        }
        cache = IssuerCache("https://access-service", tenant_service, True)

        response = Mock(Response)
        response.json.return_value = {
            "issuer": iss,
            "jwks_uri": "https://access-service/auth/realms/test_realm/certs",
        }
        mock_get.side_effect = [response, RequestError("Oh noes!")]

        issuer = cache.get_issuer(iss)
        assert issuer
        assert issuer.iss == iss
