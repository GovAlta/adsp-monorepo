from adsp_service_flask_sdk import AdspId, AdspRegistration
from adsp_service_flask_sdk.metadata import create_metadata_blueprint
from flask import Flask


def test_create_metadata_blueprint():
    blueprint = create_metadata_blueprint(
        AdspId.parse("urn:ads:platform:test-service"),
        AdspRegistration("test service", "testing 123"),
    )
    assert blueprint


def test_metadata_blueprint_get_metadata():
    blueprint = create_metadata_blueprint(
        AdspId.parse("urn:ads:platform:test-service"),
        AdspRegistration(
            "test service",
            "testing 123",
            health_endpoint_path="/health",
            docs_endpoint_path="/docs",
            api_endpoint_path="/test/v1",
        ),
    )

    app = Flask(__name__)
    app.register_blueprint(blueprint)
    client = app.test_client()
    result = client.get("/")
    assert result.json
    assert result.json["name"] == "test service"
    assert result.json["description"] == "testing 123"
