import pytest
from unittest.mock import Mock, patch

from adsp_service_flask_sdk import AdspId
from adsp_service_flask_sdk.token_provider import TokenProvider
from httpx import Response, RequestError


def test_get_access_token():
    with patch("adsp_service_flask_sdk.token_provider.post", spec=True) as mock_post:
        token_provider = TokenProvider(
            "https://access-service",
            AdspId.parse("urn:ads:platform:test-service"),
            "abc123",
        )

        response = Mock(Response)
        response.json.return_value = {"access_token": "token", "expires_in": 300}
        mock_post.return_value = response
        token = token_provider.get_access_token()
        assert token == "token"


def test_get_access_token_from_cache():
    with patch("adsp_service_flask_sdk.token_provider.post", spec=True) as mock_post:
        token_provider = TokenProvider(
            "https://access-service",
            AdspId.parse("urn:ads:platform:test-service"),
            "abc123",
        )

        response = Mock(Response)
        response.json.return_value = {"access_token": "token", "expires_in": 300}
        mock_post.return_value = response
        token_provider.get_access_token()
        token = token_provider.get_access_token()
        assert token == "token"
        mock_post.assert_called_once()


def test_get_access_token_request_error():
    with patch("adsp_service_flask_sdk.token_provider.post", spec=True) as mock_post:
        token_provider = TokenProvider(
            "https://access-service",
            AdspId.parse("urn:ads:platform:test-service"),
            "abc123",
        )
        mock_post.side_effect = RequestError("Oh noes!")

        with pytest.raises(RequestError):
            token_provider.get_access_token()
