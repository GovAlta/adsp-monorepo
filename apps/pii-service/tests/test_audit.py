"""Unit tests of the PII service audit actions and metadata."""

import importlib.util
from pathlib import Path
from types import SimpleNamespace

import jwt
from adsp_service_flask_sdk import audit_definitions

# Loaded by path because importing the package initializes the whole Flask app and Presidio.
_spec = importlib.util.spec_from_file_location(
    "pii_audit", Path(__file__).parent.parent / "pii_service" / "audit.py"
)
audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(audit)

SERVICE_USER = SimpleNamespace(name="service-account-urn:ads:platform:form-service")


def test_audit_enabled_prefers_service_flag_then_platform_flag_then_on():
    assert audit.get_audit_enabled({}) == "true"
    assert audit.get_audit_enabled({"AUDIT_ENABLED": "false"}) == "false"
    assert audit.get_audit_enabled({"PII_AUDIT_ENABLED": "false", "AUDIT_ENABLED": "true"}) == "false"
    assert audit.get_audit_enabled({"PII_AUDIT_ENABLED": "true", "AUDIT_ENABLED": "false"}) == "true"
    assert audit.get_audit_enabled({"PII_AUDIT_ENABLED": ""}) == "true"


def test_catalog_has_six_security_actions():
    catalog = audit_definitions(audit.AUDIT_ACTIONS)

    assert catalog == {
        name: {
            "version": 1,
            "category": "security",
            "severity": severity,
            "resourceType": "text-processing-request",
            "description": catalog[name]["description"],
        }
        for name, severity in [
            ("text.analyzed", "info"),
            ("text.anonymized", "info"),
            ("text.analyze-failed", "warning"),
            ("text.anonymize-failed", "warning"),
            ("text.analyze-errored", "critical"),
            ("text.anonymize-errored", "critical"),
        ]
    }


def test_calling_service_from_azp_claim():
    token = jwt.encode({"azp": "urn:ads:platform:form-service"}, "secret-secret-secret-secret-secret")
    assert audit.get_calling_service(SERVICE_USER, token) == "urn:ads:platform:form-service"


def test_calling_service_falls_back_to_service_account_name():
    assert audit.get_calling_service(SERVICE_USER, None) == "urn:ads:platform:form-service"
    assert audit.get_calling_service(SimpleNamespace(name="tester"), "not-a-jwt") is None


def test_metadata_omits_unknown_values():
    assert audit.to_metadata("en", 0.5, 3, "svc") == {
        "language": "en",
        "scoreThreshold": 0.5,
        "entitiesDetected": 3,
        "callingService": "svc",
    }
    assert audit.to_metadata(None, None, None, None, "ValueError") == {"errorType": "ValueError"}
