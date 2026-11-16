from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import httpx
import pytest

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.audit import (
    AuditAction,
    AuditRecordDetails,
    AuditService,
    audit_definitions,
    to_audit_actor,
)

SERVICE_ID = AdspId.parse("urn:ads:platform:test-service")
TENANT_ID = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test")
ACTION = AuditAction("thing.done", "security", "info", "A thing was done.")
ACTOR = {"id": "user-1", "type": "service"}


def response(status_code=200, body=None):
    return httpx.Response(status_code, json=body or {"accepted": 1, "rejected": []})


def create_service(post, is_core=True, enabled=True):
    directory = MagicMock()
    directory.get_service_url.return_value = "https://audit/audit/v1"
    token_provider = MagicMock()
    token_provider.get_access_token.return_value = "token"
    return AuditService(
        SERVICE_ID,
        directory,
        token_provider,
        [ACTION],
        is_core=is_core,
        enabled=enabled,
        post=post,
        sleep=lambda _: None,
    )


def test_audit_definitions():
    definitions = audit_definitions(
        [ACTION, AuditAction("thing.kept", "data-access", "warning", retention_class="compliance", version=2)]
    )
    assert definitions == {
        "thing.done": {"version": 1, "category": "security", "severity": "info", "description": "A thing was done."},
        "thing.kept": {"version": 2, "category": "data-access", "severity": "warning", "retentionClass": "compliance"},
    }


@pytest.mark.parametrize("actions", [[ACTION, ACTION], [AuditAction("not valid", "security", "info")]])
def test_audit_definitions_rejects_invalid_actions(actions):
    with pytest.raises(ValueError):
        audit_definitions(actions)


def test_to_audit_actor():
    service = SimpleNamespace(id="1", name="service-account-urn:ads:platform:form-service", email=None, roles=["a", ""])
    user = SimpleNamespace(id="2", name="tester", email="t@test.co", roles=None)

    assert to_audit_actor(service) == {
        "id": "1",
        "type": "service",
        "name": "service-account-urn:ads:platform:form-service",
        "roles": ["a"],
    }
    assert to_audit_actor(user) == {"id": "2", "type": "user", "name": "tester", "email": "t@test.co", "roles": []}
    with pytest.raises(ValueError):
        to_audit_actor(None)


def test_record_posts_event_for_tenant_from_core_service():
    post = MagicMock(return_value=response())
    service = create_service(post)
    occurred_at = datetime(2026, 1, 2, 3, 4, 5, 678901, tzinfo=timezone.utc)

    outcome = service.record(
        ACTION,
        AuditRecordDetails(
            ACTOR,
            TENANT_ID,
            resource={"type": "thing", "id": "1"},
            correlation_id="corr-1",
            metadata={"count": 2},
            event_id="event-1",
            occurred_at=occurred_at,
        ),
    ).result()

    assert outcome.status == "recorded"
    assert post.call_args.args[0] == "https://audit/audit/v1/test-service/events"
    assert post.call_args.kwargs["params"] == {"tenantId": str(TENANT_ID)}
    assert post.call_args.kwargs["json"] == {
        "events": [
            {
                "eventId": "event-1",
                "occurredAt": "2026-01-02T03:04:05.678Z",
                "action": "thing.done",
                "actionVersion": 1,
                "status": "success",
                "actor": ACTOR,
                "resource": {"type": "thing", "id": "1"},
                "correlationId": "corr-1",
                "metadata": {"count": 2},
            }
        ]
    }


def test_record_from_tenant_service_omits_tenant():
    post = MagicMock(return_value=response())
    create_service(post, is_core=False).record(ACTION, AuditRecordDetails(ACTOR, TENANT_ID)).result()

    assert post.call_args.kwargs["params"] is None


@pytest.mark.parametrize(
    "is_core,enabled,tenant_id,code",
    [(True, True, None, "invalid_event"), (True, False, TENANT_ID, "disabled")],
)
def test_record_rejects_without_sending(is_core, enabled, tenant_id, code):
    post = MagicMock()
    outcome = create_service(post, is_core, enabled).record(ACTION, AuditRecordDetails(ACTOR, tenant_id)).result()

    assert (outcome.status, outcome.code) == ("rejected", code)
    post.assert_not_called()


def test_record_unregistered_action_raises():
    with pytest.raises(ValueError):
        create_service(MagicMock()).record(
            AuditAction("other", "security", "info"), AuditRecordDetails(ACTOR, TENANT_ID)
        )


def test_record_retries_transient_failures():
    post = MagicMock(side_effect=[response(503), httpx.ConnectError("x"), response()])
    outcome = create_service(post).record(ACTION, AuditRecordDetails(ACTOR, TENANT_ID)).result()

    assert outcome.status == "recorded"
    assert post.call_count == 3


def test_record_gives_up_after_retries():
    post = MagicMock(return_value=response(503))
    outcome = create_service(post).record(ACTION, AuditRecordDetails(ACTOR, TENANT_ID)).result()

    assert (outcome.status, outcome.code) == ("failed", "retries_exhausted")
    assert post.call_count == 4


def test_record_does_not_retry_client_errors():
    post = MagicMock(return_value=response(403))
    outcome = create_service(post).record(ACTION, AuditRecordDetails(ACTOR, TENANT_ID)).result()

    assert (outcome.status, outcome.code) == ("failed", "request_failed")
    assert post.call_count == 1


def test_record_reports_rejection():
    rejected = {"accepted": 0, "rejected": [{"index": 0, "code": "invalid_event", "reason": "bad actor"}]}
    post = MagicMock(return_value=response(202, rejected))
    outcome = create_service(post).record(ACTION, AuditRecordDetails(ACTOR, TENANT_ID)).result()

    assert outcome.status == "rejected"
    assert (outcome.code, outcome.reason) == ("invalid_event", "bad actor")


def test_flush_waits_for_pending_events():
    post = MagicMock(return_value=response())
    service = create_service(post)
    futures = [service.record(ACTION, AuditRecordDetails(ACTOR, TENANT_ID)) for _ in range(3)]

    service.flush()

    assert all(future.done() for future in futures)
    assert post.call_count == 3
