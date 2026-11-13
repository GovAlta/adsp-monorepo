"""Tests of the audit wiring of the PII service endpoints, with Presidio and the ADSP platform stubbed."""

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock

import jwt
import pytest
from adsp_service_flask_sdk import AdspExtension, AdspId
from flask import Blueprint, globals as flask_globals
from flask.testing import FlaskClient

TENANT = SimpleNamespace(id=AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"))
USER = SimpleNamespace(
    id="user-1",
    name="service-account-urn:ads:platform:form-service",
    email="svc@example.com",
    roles=["pii-analyzer"],
    is_core=False,
)
SECRET_TEXT = "My SIN is 046 454 286 and I am Jane Doe"


class FakeResult:
    def to_dict(self):
        return {"entity_type": "CA_SIN", "start": 10, "end": 21, "score": 0.9}


def _stub_presidio(monkeypatch, analyze):
    class AnalyzerRequest:
        def __init__(self, data):
            self.text = data.get("text")
            self.language = data.get("language")
            self.score_threshold = data.get("score_threshold")
            self.correlation_id = data.get("correlation_id")
            self.entities = None
            self.return_decision_process = False
            self.context = None

    engine = MagicMock()
    engine.analyze.side_effect = analyze
    modules = {
        "presidio_analyzer": ModuleType("presidio_analyzer"),
        "presidio_analyzer.analyzer_engine": SimpleNamespace(AnalyzerEngine=lambda: engine),
        "presidio_analyzer.analyzer_request": SimpleNamespace(AnalyzerRequest=AnalyzerRequest),
        "presidio_anonymizer": SimpleNamespace(
            AnonymizerEngine=lambda: SimpleNamespace(
                anonymize=lambda text, results: SimpleNamespace(to_json=lambda: '{"text": "<redacted>"}')
            )
        ),
    }
    for name, module in modules.items():
        monkeypatch.setitem(sys.modules, name, module)
    for name in ("ca_bank_recognizer", "ca_passport_recognizer", "ca_sin_recognizer", "ca_postal_code_recognizer"):
        module = ModuleType(f"pii_service.recognizers.{name}")
        for cls in ("CaBankRecognizer", "CaPassportRecognizer", "CaSinRecognizer", "CaPostalCodeRecognizer"):
            setattr(module, cls, MagicMock())
        monkeypatch.setitem(sys.modules, f"pii_service.recognizers.{name}", module)
    recognizers = ModuleType("pii_service.recognizers")
    recognizers.CaPostalCodeRecognizer = MagicMock()
    monkeypatch.setitem(sys.modules, "pii_service.recognizers", recognizers)


@pytest.fixture
def pii(monkeypatch):
    monkeypatch.setenv("CLIENT_SECRET", "secret")
    registrations = []

    def init_app(self, app, registration, config=None):
        registrations.append(registration)
        return SimpleNamespace(
            directory=MagicMock(),
            token_provider=MagicMock(),
            metadata_blueprint=Blueprint("meta", __name__),
            audit_service=MagicMock(),
        )

    monkeypatch.setattr(AdspExtension, "init_app", init_app)
    state = SimpleNamespace(analyze=lambda **kwargs: [FakeResult(), FakeResult()], registrations=registrations)
    _stub_presidio(monkeypatch, lambda **kwargs: state.analyze(**kwargs))
    monkeypatch.delitem(sys.modules, "pii_service", raising=False)
    monkeypatch.delitem(sys.modules, "pii_service.app", raising=False)
    monkeypatch.delitem(sys.modules, "pii_service.audit", raising=False)

    import importlib

    module = importlib.import_module("pii_service.app")

    @module.app.before_request
    def authenticate():
        ctx = flask_globals.request_ctx._get_current_object()
        setattr(ctx, "_adsp_user", USER)
        setattr(ctx, "_adsp_tenant", TENANT)

    module.app.testing = True
    return module, state


def post(module, path, body):
    token = jwt.encode({"azp": "urn:ads:platform:form-service"}, "secret-secret-secret-secret-secret")
    client: FlaskClient = module.app.test_client()
    return client.post(path, json=body, headers={"Authorization": f"Bearer {token}"})


def recorded(module):
    action, details = module.adsp.audit_service.record.call_args.args
    return SimpleNamespace(
        action=action.name,
        tenant=details.tenant_id,
        actor=details.actor,
        resource=details.resource,
        correlation_id=details.correlation_id,
        metadata=details.metadata,
        status=details.status,
    )


def test_registration_includes_audit_actions(pii):
    _, state = pii
    assert [action.name for action in state.registrations[0].audit_actions] == [
        "text.analyzed",
        "text.anonymized",
        "text.analyze-failed",
        "text.anonymize-failed",
        "text.analyze-errored",
        "text.anonymize-errored",
    ]


def test_analyze_records_success_without_content(pii):
    module, _ = pii
    response = post(module, "/pii/v1/analyze", {"text": SECRET_TEXT, "language": "en", "score_threshold": 0.5})

    assert response.status_code == 200
    record = recorded(module)
    assert record.action == "text.analyzed"
    assert record.status == "success"
    assert record.tenant == TENANT.id
    assert record.actor == {
        "id": "user-1",
        "type": "service",
        "name": "service-account-urn:ads:platform:form-service",
        "email": "svc@example.com",
        "roles": ["pii-analyzer"],
    }
    assert record.resource == {"type": "text-processing-request", "id": record.correlation_id}
    assert record.metadata == {
        "language": "en",
        "scoreThreshold": 0.5,
        "entitiesDetected": 2,
        "callingService": "urn:ads:platform:form-service",
    }
    assert "046 454 286" not in str(record) and "Jane" not in str(record)


def test_audit_failure_does_not_fail_request(pii):
    module, _ = pii
    module.adsp.audit_service.record.side_effect = RuntimeError("audit down")

    response = post(module, "/pii/v1/analyze", {"text": SECRET_TEXT, "language": "en"})

    assert response.status_code == 200


def test_anonymize_records_success_and_uses_supplied_correlation_id(pii):
    module, _ = pii
    response = post(
        module, "/pii/v1/anonymize", {"text": SECRET_TEXT, "language": "en", "correlation_id": "corr-9"}
    )

    assert response.status_code == 200
    record = recorded(module)
    assert record.action == "text.anonymized"
    assert record.correlation_id == "corr-9"
    assert record.metadata["entitiesDetected"] == 2


def test_analyze_error_records_errored_action_with_error_type_only(pii):
    module, state = pii

    def fail(**kwargs):
        raise RuntimeError(f"NLP failed on {SECRET_TEXT}")

    state.analyze = fail
    with pytest.raises(RuntimeError):
        post(module, "/pii/v1/analyze", {"text": SECRET_TEXT, "language": "en"})

    record = recorded(module)
    assert record.action == "text.analyze-errored"
    assert record.status == "error"
    assert record.metadata["errorType"] == "RuntimeError"
    assert "046" not in str(record.metadata) and "Jane" not in str(record.metadata)


def test_anonymize_error_records_errored_action(pii):
    module, state = pii
    state.analyze = MagicMock(side_effect=RuntimeError("boom"))
    with pytest.raises(RuntimeError):
        post(module, "/pii/v1/anonymize", {"text": SECRET_TEXT, "language": "en"})

    assert recorded(module).action == "text.anonymize-errored"


def test_validation_failure_is_audited_as_failed(pii):
    module, _ = pii
    response = post(module, "/pii/v1/analyze", {"text": SECRET_TEXT, "language": "fr"})

    assert response.status_code == 400
    record = recorded(module)
    assert record.action == "text.analyze-failed"
    assert record.status == "failure"
    assert record.metadata["errorType"] == "BadRequest"
