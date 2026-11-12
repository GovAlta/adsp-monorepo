"""Audit actions of the PII service.

Records must never contain request text, detected PII values or replacement strings; the only content-derived
value recorded is the count of detected entities.
"""

from typing import Any, Dict, List, Optional

from adsp_py_common.audit import SERVICE_ACCOUNT_PREFIX
from adsp_service_flask_sdk import AuditAction
from jwt import decode

RESOURCE_TYPE = "text-processing-request"


def _security_action(name: str, severity: str, description: str) -> AuditAction:
    return AuditAction(
        name,
        category="security",
        severity=severity,
        description=description,
        retention_class="security",
        resource_type=RESOURCE_TYPE,
    )


TEXT_ANALYZED = _security_action("text.analyzed", "info", "A PII analysis request completed.")
TEXT_ANONYMIZED = _security_action("text.anonymized", "info", "A PII anonymization request completed.")
TEXT_ANALYZE_FAILED = _security_action("text.analyze-failed", "warning", "A PII analysis request failed.")
TEXT_ANONYMIZE_FAILED = _security_action("text.anonymize-failed", "warning", "A PII anonymization request failed.")
TEXT_ANALYZE_ERRORED = _security_action(
    "text.analyze-errored", "critical", "A PII analysis request failed with a service error."
)
TEXT_ANONYMIZE_ERRORED = _security_action(
    "text.anonymize-errored", "critical", "A PII anonymization request failed with a service error."
)

AUDIT_ACTIONS: List[AuditAction] = [
    TEXT_ANALYZED,
    TEXT_ANONYMIZED,
    TEXT_ANALYZE_FAILED,
    TEXT_ANONYMIZE_FAILED,
    TEXT_ANALYZE_ERRORED,
    TEXT_ANONYMIZE_ERRORED,
]


def get_calling_service(user, token: Optional[str]) -> Optional[str]:
    """Client of the calling service, from the `azp` claim of the already validated access token."""
    if token:
        try:
            azp = decode(token, options={"verify_signature": False}).get("azp")
            if azp:
                return azp
        except Exception:
            pass
    name = getattr(user, "name", None)
    if name and name.startswith(SERVICE_ACCOUNT_PREFIX):
        return name[len(SERVICE_ACCOUNT_PREFIX):]
    return None


def to_metadata(
    language: Optional[str],
    score_threshold: Optional[float],
    entities_detected: Optional[int],
    calling_service: Optional[str],
    error_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Request metadata. Only the error type is recorded for failures, as messages may echo request content."""
    metadata = {
        "language": language,
        "scoreThreshold": score_threshold,
        "entitiesDetected": entities_detected,
        "callingService": calling_service,
        "errorType": error_type,
    }
    return {key: value for key, value in metadata.items() if value is not None}
