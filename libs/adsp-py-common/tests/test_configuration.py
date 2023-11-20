import pytest
from unittest.mock import Mock, patch

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.configuration import ConfigurationService
from adsp_py_common.directory import ServiceDirectory
from adsp_py_common.token_provider import TokenProvider
from httpx import Response, RequestError


def test_get_configuration():
    with patch("adsp_py_common.configuration.get") as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        configuration_service = ConfigurationService(directory, token_provider)

        configuration = {"testing": 123}
        response = Mock(Response)
        response.json.return_value = configuration
        mock_get.return_value = response
        tenant_config, core_config = configuration_service.get_configuration(
            AdspId.parse("urn:ads:platform:test-service")
        )
    assert tenant_config is not None
    assert not tenant_config
    assert core_config
    assert core_config["testing"] == 123


def test_get_configuration_tenant():
    with patch("adsp_py_common.configuration.get") as mock_get:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        configuration_service = ConfigurationService(directory, token_provider)

        configuration = {"testing": 123}
        response = Mock(Response)
        response.json.return_value = configuration
        mock_get.return_value = response
        tenant_config, core_config = configuration_service.get_configuration(
            AdspId.parse("urn:ads:platform:test-service"),
            AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        )
    assert tenant_config
    assert tenant_config["testing"] == 123
    assert core_config
    assert core_config["testing"] == 123


def test_get_configuration_request_error():
    with patch("adsp_py_common.configuration.get") as mock_get:
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
