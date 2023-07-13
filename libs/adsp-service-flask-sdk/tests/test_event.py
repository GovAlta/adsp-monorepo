from unittest.mock import Mock, patch

from adsp_service_flask_sdk import (
    AdspId,
    AdspRegistration,
    DomainEvent,
    DomainEventDefinition,
)
from adsp_service_flask_sdk.directory import ServiceDirectory
from adsp_service_flask_sdk.event import EventService
from adsp_service_flask_sdk.token_provider import TokenProvider
from datetime import datetime
from httpx import RequestError
import pytest


def test_send_event():
    with patch("adsp_service_flask_sdk.event.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://event-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registration = AdspRegistration(
            "test service",
            events=[
                DomainEventDefinition(
                    "test-event", "Signalled when testing.", {"type": "object"}
                )
            ],
        )

        event_service = EventService(
            AdspId.parse("urn:ads:platform:test-service"),
            directory,
            token_provider,
            registration,
        )

        event_service.send(DomainEvent("test-event", datetime.utcnow(), {}))
        mock_post.assert_called_once()


def test_send_event_request_error():
    with patch("adsp_service_flask_sdk.event.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://event-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registration = AdspRegistration(
            "test service",
            events=[
                DomainEventDefinition(
                    "test-event", "Signalled when testing.", {"type": "object"}
                )
            ],
        )

        event_service = EventService(
            AdspId.parse("urn:ads:platform:test-service"),
            directory,
            token_provider,
            registration,
        )

        mock_post.side_effect = RequestError("Oh noes!")
        event_service.send(DomainEvent("test-event", datetime.utcnow(), {}))
        mock_post.assert_called_once()


def test_send_event_unregistered_event():
    with patch("adsp_service_flask_sdk.event.post") as mock_post:
        directory = Mock(ServiceDirectory)
        directory.get_service_url.return_value = "https://event-service"
        token_provider = Mock(TokenProvider)
        token_provider.get_access_token.return_value = "token"
        registration = AdspRegistration(
            "test service",
            events=[
                DomainEventDefinition(
                    "test-event", "Signalled when testing.", {"type": "object"}
                )
            ],
        )

        event_service = EventService(
            AdspId.parse("urn:ads:platform:test-service"),
            directory,
            token_provider,
            registration,
        )

        with pytest.raises(ValueError):
            event_service.send(DomainEvent("not-test-event", datetime.utcnow(), {}))
        mock_post.assert_not_called()
