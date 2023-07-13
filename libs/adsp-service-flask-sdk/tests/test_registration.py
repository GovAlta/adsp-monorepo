import pytest
from unittest.mock import Mock, patch

from adsp_service_flask_sdk import (
    AdspId,
    AdspRegistration,
    ConfigurationDefinition,
    DomainEventDefinition,
    FileType,
    ServiceRole,
    StreamDefinition,
)
from adsp_service_flask_sdk.directory import ServiceDirectory
from adsp_service_flask_sdk.registration import ServiceRegistrar
from adsp_service_flask_sdk.token_provider import TokenProvider
from httpx import RequestError


def test_register():
    directory = Mock(ServiceDirectory)
    directory.get_service_url.return_value = "https://tenant-service"
    token_provider = Mock(TokenProvider)
    token_provider.get_access_token.return_value = "token"
    registrar = ServiceRegistrar(
        AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
    )
    registrar.register(AdspRegistration("test service"))


def test_register_configuration():
    with patch("adsp_service_flask_sdk.registration.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registrar = ServiceRegistrar(
            AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
        )
        registrar.register(
            AdspRegistration(
                "test service",
                configuration=ConfigurationDefinition(
                    "testing configuration", {"type": "object"}
                ),
            )
        )
        mock_post.assert_called_once()


def test_register_roles():
    with patch("adsp_service_flask_sdk.registration.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registrar = ServiceRegistrar(
            AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
        )
        registrar.register(
            AdspRegistration(
                "test service",
                roles=[ServiceRole("tester", "Tester role")],
            )
        )
        mock_post.assert_called_once()


def test_register_events():
    with patch("adsp_service_flask_sdk.registration.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registrar = ServiceRegistrar(
            AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
        )
        registrar.register(
            AdspRegistration(
                "test service",
                events=[
                    DomainEventDefinition(
                        "test-event", "Signalled in testing.", {"type": "object"}
                    )
                ],
            )
        )
        mock_post.assert_called_once()


def test_register_streams():
    with patch("adsp_service_flask_sdk.registration.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registrar = ServiceRegistrar(
            AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
        )
        registrar.register(
            AdspRegistration(
                "test service",
                event_streams=[
                    StreamDefinition("test-stream", "Test stream", "Stream for testing")
                ],
            )
        )
        mock_post.assert_called_once()


def test_register_file_types():
    with patch("adsp_service_flask_sdk.registration.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registrar = ServiceRegistrar(
            AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
        )
        registrar.register(
            AdspRegistration(
                "test service",
                file_types=[FileType("test-file-type", "Test file type")],
            )
        )
        mock_post.assert_called_once()


def test_register_request_error():
    with patch("adsp_service_flask_sdk.registration.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://tenant-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registrar = ServiceRegistrar(
            AdspId.parse("urn:ads:platform:test-service"), directory, token_provider
        )

        mock_post.side_effect = RequestError("Oh noes!")
        with pytest.raises(RequestError):
            registrar.register(
                AdspRegistration(
                    "test service",
                    configuration=ConfigurationDefinition(
                        "testing configuration", {"type": "object"}
                    ),
                )
            )
