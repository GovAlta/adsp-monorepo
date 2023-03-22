import pytest
from unittest.mock import patch

from adsp_service_flask_sdk import AdspExtension, AdspRegistration
from flask import Flask


def test_init_app():
    with patch(
        "adsp_service_flask_sdk.extension.ServiceRegistrar", spec=True
    ) as mock_registrar:
        app = Flask(__name__)
        extension = AdspExtension()

        services = extension.init_app(
            app,
            AdspRegistration("test service"),
            {
                "ADSP_ACCESS_SERVICE_URL": "https://access-service",
                "ADSP_DIRECTORY_URL": "https://directory",
                "ADSP_SERVICE_ID": "urn:ads:platform:test-service",
                "ADSP_CLIENT_SECRET": "abc123",
            },
        )
        assert services
        assert app.extensions["adsp_extension"] == extension
        mock_registrar.assert_called_once()


def test_init_app_missing_config():
    app = Flask(__name__)
    registration = AdspRegistration("test service")
    extension = AdspExtension()
    config = {
        "ADSP_ACCESS_SERVICE_URL": "https://access-service",
        "ADSP_DIRECTORY_URL": "https://directory",
        "ADSP_SERVICE_ID": "urn:ads:platform:test-service",
        "ADSP_CLIENT_SECRET": "abc123",
    }

    for key, _ in config.items():
        with pytest.raises(ValueError):
            extension.init_app(
                app,
                registration,
                {name: value for (name, value) in config.items() if name != key},
            )
