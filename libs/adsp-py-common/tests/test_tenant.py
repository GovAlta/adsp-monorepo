import pytest
from unittest.mock import Mock, patch

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.directory import ServiceDirectory
from adsp_py_common.tenant import TenantService
from adsp_py_common.token_provider import TokenProvider
from more_itertools import first
from httpx import Response, RequestError


def test_get_tenants():
    with patch("adsp_py_common.tenant.get", spec=True) as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        tenant_service = TenantService(directory, token_provider)

        tenant = {
            "id": "urn:ads:platform:tenant-service:v2:/tenants/test",
            "name": "test",
            "realm": "test_realm",
            "adminEmail": "test@test.co",
        }
        response = Mock(Response)
        response.json.return_value = {"results": [tenant]}
        mock_get.return_value = response

        tenants = tenant_service.get_tenants()
        assert len(tenants) == 1
        result = first(tenants.values())
        assert str(result.id) == tenant["id"]
        assert result.name == tenant["name"]
        assert result.realm == tenant["realm"]
        assert result.admin_email == tenant["adminEmail"]


def test_get_tenant():
    with patch("adsp_py_common.tenant.get", spec=True) as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        tenant_service = TenantService(directory, token_provider)

        tenant = {
            "id": "urn:ads:platform:tenant-service:v2:/tenants/test",
            "name": "test",
            "realm": "test_realm",
            "adminEmail": "test@test.co",
        }
        response = Mock(Response)
        response.json.return_value = {"results": [tenant]}
        mock_get.return_value = response

        result = tenant_service.get_tenant(AdspId.parse(tenant["id"]))
        assert str(result.id) == tenant["id"]
        assert result.name == tenant["name"]
        assert result.realm == tenant["realm"]
        assert result.admin_email == tenant["adminEmail"]


def test_get_tenants_request_error():
    with patch("adsp_py_common.tenant.get", spec=True) as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        tenant_service = TenantService(directory, token_provider)

        mock_get.side_effect = RequestError("Oh noes!")
        with pytest.raises(RequestError):
            tenant_service.get_tenants()


def test_get_tenant_from_cache():
    with patch("adsp_py_common.tenant.get", spec=True) as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        tenant_service = TenantService(directory, token_provider)

        tenant = {
            "id": "urn:ads:platform:tenant-service:v2:/tenants/test",
            "name": "test",
            "realm": "test_realm",
            "adminEmail": "test@test.co",
        }
        response = Mock(Response)
        response.json.return_value = {"results": [tenant]}
        mock_get.return_value = response

        tenant_id = AdspId.parse(tenant["id"])
        tenant_service.get_tenant(tenant_id)
        result = tenant_service.get_tenant(tenant_id)
        assert str(result.id) == tenant["id"]
        mock_get.assert_called_once()
