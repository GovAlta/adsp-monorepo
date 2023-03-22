import pytest
from unittest.mock import Mock, patch

from adsp_service_flask_sdk import AdspId, Tenant
from adsp_service_flask_sdk.configuration import (
    ConfigurationService,
    create_get_configuration,
)
from adsp_service_flask_sdk.directory import ServiceDirectory
from adsp_service_flask_sdk.token_provider import TokenProvider
from httpx import Response, RequestError


def test_get_configuration():
    with patch("adsp_service_flask_sdk.configuration.get") as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        configuration_service = ConfigurationService(directory, token_provider)

        configuration = {"testing": 123}
        response = Mock(Response)
        response.json.return_value = configuration
        mock_get.return_value = response
        result = configuration_service.get_configuration(
            AdspId.parse("urn:ads:platform:test-service")
        )
    assert result
    assert result["testing"] == 123


def test_get_configuration_tenant():
    with patch("adsp_service_flask_sdk.configuration.get") as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        configuration_service = ConfigurationService(directory, token_provider)

        configuration = {"testing": 123}
        response = Mock(Response)
        response.json.return_value = configuration
        mock_get.return_value = response
        result = configuration_service.get_configuration(
            AdspId.parse("urn:ads:platform:test-service"),
            AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        )
    assert result
    assert result["testing"] == 123


def test_get_configuration_request_error():
    with patch("adsp_service_flask_sdk.configuration.get") as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        configuration_service = ConfigurationService(directory, token_provider)

        mock_get.side_effect = RequestError("Oh noes!")
        with pytest.raises(RequestError):
            configuration_service.get_configuration(
                AdspId.parse("urn:ads:platform:test-service")
            )


def test_create_get_configuration():
    configuration_service = Mock(ConfigurationService)
    get_configuration = create_get_configuration(
        configuration_service, AdspId.parse("urn:ads:platform:tenant-service")
    )
    assert get_configuration


def test_get_configuration_context():
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )
    service_id = AdspId.parse("urn:ads:platform:tenant-service")
    with patch("adsp_service_flask_sdk.configuration.request_tenant", tenant):
        configuration_service = Mock(ConfigurationService)
        get_configuration = create_get_configuration(configuration_service, service_id)

        configuration = {"testing": 123}
        configuration_service.get_configuration.return_value = configuration
        result = get_configuration()
        assert result
        assert result["testing"] == 123
        configuration_service.get_configuration.assert_called_once_with(service_id, tenant.id)
