import pytest
from adsp_py_common.constants import CONTEXT_TENANT, CONTEXT_USER
from adsp_service_flask_sdk import AdspId, Tenant, User, audit_details_from_request
from flask import Flask, globals

TENANT = Tenant(
    AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
    "test",
    "test_realm",
    "test@test.co",
)
USER = User(TENANT, "svc", "service-account-urn:ads:test:gateway", None, None, None, ["reader"])


def _set_request_context(user, tenant):
    request_ctx = globals.request_ctx._get_current_object()
    setattr(request_ctx, CONTEXT_USER, user)
    setattr(request_ctx, CONTEXT_TENANT, tenant)


def test_audit_details_from_request():
    with Flask(__name__).test_request_context():
        _set_request_context(USER, TENANT)

        details = audit_details_from_request(status="error", correlation_id="corr-1")

        assert details.actor == {
            "id": "svc",
            "type": "service",
            "name": "service-account-urn:ads:test:gateway",
            "roles": ["reader"],
        }
        assert details.tenant_id == TENANT.id
        assert (details.status, details.correlation_id) == ("error", "corr-1")


def test_audit_details_from_request_overrides():
    other_tenant = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/other")
    with Flask(__name__).test_request_context():
        _set_request_context(None, None)

        details = audit_details_from_request(actor={"id": "system", "type": "system"}, tenant_id=other_tenant)

        assert details.actor == {"id": "system", "type": "system"}
        assert details.tenant_id == other_tenant


def test_audit_details_from_request_without_user():
    with Flask(__name__).test_request_context():
        _set_request_context(None, None)

        with pytest.raises(ValueError):
            audit_details_from_request()
