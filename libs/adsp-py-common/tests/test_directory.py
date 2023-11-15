import pytest
from unittest.mock import Mock, patch

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.directory import ServiceDirectory
from httpx import Response, RequestError


def test_get_service_url():
    with patch("adsp_py_common.directory.get", spec=True) as mock_get:
        urn = "urn:ads:platform:test-service"
        url = "https://directory"

        directory = ServiceDirectory(url)
        response = Mock(Response)
        response.json.return_value = [{"urn": urn, "url": url}]
        mock_get.return_value = response

        result = directory.get_service_url(AdspId.parse(urn))
        assert result == url


def test_get_service_url_from_cache():
    with patch("adsp_py_common.directory.get", spec=True) as mock_get:
        urn = "urn:ads:platform:test-service"
        url = "https://directory"

        directory = ServiceDirectory(url)
        response = Mock(Response)
        response.json.return_value = [{"urn": urn, "url": url}]
        mock_get.return_value = response

        directory.get_service_url(AdspId.parse(urn))
        result = directory.get_service_url(AdspId.parse(urn))
        assert result == url
        mock_get.assert_called_once()


def test_get_service_url_request_error():
    with patch("adsp_py_common.directory.get", spec=True) as mock_get:
        urn = "urn:ads:platform:test-service"
        url = "https://directory"

        directory = ServiceDirectory(url)
        mock_get.side_effect = RequestError("Oh noes!")

        with pytest.raises(RequestError):
            directory.get_service_url(AdspId.parse(urn))
