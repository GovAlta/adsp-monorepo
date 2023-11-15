import pytest
from unittest.mock import Mock, patch

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.directory import ServiceDirectory
from adsp_py_common.event import DomainEvent, EventService
from adsp_py_common.registration import AdspRegistration, DomainEventDefinition
from adsp_py_common.token_provider import TokenProvider
from datetime import datetime
from httpx import RequestError


def test_send_event():
    with patch("adsp_py_common.event.post") as mock_post:
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
    with patch("adsp_py_common.event.post") as mock_post:
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
    with patch("adsp_py_common.event.post") as mock_post:
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
