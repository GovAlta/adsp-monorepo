from unittest.mock import patch

from adsp_service_django_sdk import adsp


def test_setup_adsp():
    with patch(
        "adsp_service_django_sdk._setup.environ",
        {"ADSP_REGISTRATION_MODULE": "tests.registration"},
    ), patch(
        "adsp_service_django_sdk._setup.settings",
        ADSP_ACCESS_SERVICE_URL="https://access-service",
        ADSP_DIRECTORY_URL="https://directory",
        ADSP_SERVICE_ID="urn:ads:platform:test-service",
        ADSP_CLIENT_SECRET="abc123",
    ), patch(
        "adsp_service_django_sdk._setup.ServiceRegistrar", spec=True
    ) as mock_registrar:
        service_id = adsp.service_id
        assert service_id
        mock_registrar.assert_called_once()
