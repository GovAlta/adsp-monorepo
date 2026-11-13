from typing import Any, Dict, Optional

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.audit import AuditRecordDetails, to_audit_actor

from .filter import request_tenant, request_user


def audit_details_from_request(
    actor: Optional[Dict[str, Any]] = None,
    tenant_id: Optional[AdspId] = None,
    **details: Any,
) -> AuditRecordDetails:
    """Builds audit record details for the current request.

    The actor defaults to the request user and the tenant to the request tenant; explicit values take precedence.
    Raises ValueError when no actor is provided and the request has no user.
    """
    if actor is None:
        actor = to_audit_actor(request_user._get_current_object() if request_user else None)
    if tenant_id is None and request_tenant:
        tenant_id = request_tenant.id
    return AuditRecordDetails(actor=actor, tenant_id=tenant_id, **details)
