import logging
import re
import time
from concurrent.futures import Future, ThreadPoolExecutor, wait
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Callable, Dict, List, NamedTuple, Optional, Set
from uuid import uuid4

import httpx

from .adsp_id import AdspId
from .constants import PLATFORM_AUDIT_API
from .directory import ServiceDirectory
from .token_provider import TokenProvider

# Keycloak names service account users with this prefix.
SERVICE_ACCOUNT_PREFIX = "service-account-"

_ACTION_NAME = re.compile(r"^[a-zA-Z0-9]+(?:[._:-][a-zA-Z0-9]+)*$")
# Rate limiting, storage unavailability and gateway errors.
_TRANSIENT_STATUSES = {429, 502, 503, 504}
_RETRY_DELAYS_SECONDS = (0.2, 1.0, 3.0)
_REQUEST_TIMEOUT_SECONDS = 10


class AuditAction(NamedTuple):
    """Definition of an audit action.

    When retention_class is not set, the audit service derives it from the category.
    """

    name: str
    category: str
    severity: str
    description: Optional[str] = None
    version: int = 1
    retention_class: Optional[str] = None
    resource_type: Optional[str] = None


class AuditRecordDetails(NamedTuple):
    actor: Dict[str, Any]
    # Required for a core (platform) service; a tenant service records in the tenant of its service account.
    tenant_id: Optional[AdspId] = None
    status: str = "success"
    resource: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    event_id: Optional[str] = None
    occurred_at: Optional[datetime] = None


class AuditRecordOutcome(NamedTuple):
    status: str  # recorded, rejected, or failed
    event_id: str
    code: Optional[str] = None
    reason: Optional[str] = None


def audit_definitions(actions: List[AuditAction]) -> Dict[str, Dict[str, Any]]:
    """Converts action definitions into an audit action catalog, rejecting invalid and duplicate names."""
    definitions: Dict[str, Dict[str, Any]] = {}
    for action in actions:
        if not isinstance(action.name, str) or not _ACTION_NAME.match(action.name):
            raise ValueError(f"Invalid audit action name: {action.name}")
        if action.name in definitions:
            raise ValueError(f"Duplicate audit action name: {action.name}")
        definition = {
            "version": action.version,
            "category": action.category,
            "severity": action.severity,
            "retentionClass": action.retention_class,
            "description": action.description,
            "resourceType": action.resource_type,
        }
        definitions[action.name] = {key: value for key, value in definition.items() if value is not None}
    return definitions


def to_audit_actor(user) -> Dict[str, Any]:
    """Converts an authenticated user into an audit actor; Keycloak service accounts become `service` actors."""
    if not user:
        raise ValueError("Cannot create an audit actor without a user.")

    actor = {
        "id": user.id,
        "type": "service" if user.name and user.name.startswith(SERVICE_ACCOUNT_PREFIX) else "user",
        "name": user.name or None,
        "email": user.email or None,
        "roles": [role for role in user.roles or [] if role],
    }
    return {key: value for key, value in actor.items() if value is not None}


class AuditService:
    """Records audit events in the background so requests are not blocked or failed by auditing."""

    _logger = logging.getLogger("adsp.audit-service")

    def __init__(
        self,
        service_id: AdspId,
        directory: ServiceDirectory,
        token_provider: TokenProvider,
        actions: Optional[List[AuditAction]] = None,
        is_core: bool = True,
        enabled: bool = True,
        post: Callable[..., httpx.Response] = httpx.post,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self.__namespace = service_id.service
        self.__directory = directory
        self.__token_provider = token_provider
        self.__actions = {action.name for action in actions or []}
        self.__is_core = is_core
        self.__enabled = enabled
        self.__post = post
        self.__sleep = sleep
        self.__executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="adsp-audit")
        self.__pending: Set[Future] = set()
        self.__pending_lock = Lock()

    def record(self, action: AuditAction, details: AuditRecordDetails) -> "Future[AuditRecordOutcome]":
        """Records an event; the returned future never raises and resolves to the outcome."""
        if action.name not in self.__actions:
            raise ValueError(f"Audit action '{action.name}' is not registered for the service.")

        event_id = details.event_id or str(uuid4())
        if not self.__enabled:
            return self._settled(AuditRecordOutcome("rejected", event_id, "disabled", "Audit recording is disabled."))
        if self.__is_core and not details.tenant_id:
            return self._settled(
                self._fail(
                    "rejected",
                    action.name,
                    event_id,
                    "invalid_event",
                    "tenantId is required to record an audit event from a core service.",
                )
            )

        event = {
            "eventId": event_id,
            "occurredAt": _to_iso(details.occurred_at or datetime.now(timezone.utc)),
            "action": action.name,
            "actionVersion": action.version,
            "status": details.status or "success",
            "actor": details.actor,
            "resource": details.resource,
            "correlationId": details.correlation_id,
            "metadata": details.metadata,
        }
        event = {key: value for key, value in event.items() if value is not None}
        tenant_id = str(details.tenant_id) if self.__is_core else None

        future = self.__executor.submit(self._send, action.name, tenant_id, event)
        with self.__pending_lock:
            self.__pending.add(future)
        future.add_done_callback(self._settle)
        return future

    def flush(self, timeout: Optional[float] = None) -> None:
        """Waits for events being sent, including retries; call before shutdown."""
        with self.__pending_lock:
            pending = list(self.__pending)
        wait(pending, timeout)

    def _settle(self, future: Future) -> None:
        with self.__pending_lock:
            self.__pending.discard(future)

    @staticmethod
    def _settled(outcome: AuditRecordOutcome) -> "Future[AuditRecordOutcome]":
        future: Future = Future()
        future.set_result(outcome)
        return future

    def _fail(self, status: str, action: str, event_id: str, code: str, reason: str) -> AuditRecordOutcome:
        self._logger.warning("Audit event %s (%s) was not recorded: %s %s", action, event_id, code, reason)
        return AuditRecordOutcome(status, event_id, code, reason)

    def _send(self, action: str, tenant_id: Optional[str], event: Dict[str, Any]) -> AuditRecordOutcome:
        event_id = event["eventId"]
        # The final attempt has no delay; it either returns an outcome or gives up.
        for delay in (*_RETRY_DELAYS_SECONDS, None):
            try:
                url = self.__directory.get_service_url(PLATFORM_AUDIT_API)
                token = self.__token_provider.get_access_token()
                response = self.__post(
                    f"{url}/{self.__namespace}/events",
                    json={"events": [event]},
                    params={"tenantId": tenant_id} if tenant_id else None,
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=_REQUEST_TIMEOUT_SECONDS,
                )
                if response.status_code in _TRANSIENT_STATUSES:
                    raise _TransientError(response.status_code)
                if response.status_code >= 400:
                    return self._fail(
                        "failed", action, event_id, "request_failed", f"Status {response.status_code}."
                    )

                rejected = response.json().get("rejected") or []
                if rejected:
                    return self._fail(
                        "rejected", action, event_id, rejected[0].get("code"), rejected[0].get("reason", "")
                    )
                return AuditRecordOutcome("recorded", event_id)
            except (httpx.RequestError, _TransientError) as err:
                if delay is None:
                    return self._fail("failed", action, event_id, "retries_exhausted", str(err))
                self.__sleep(delay)
            except Exception as err:
                return self._fail("failed", action, event_id, "request_failed", str(err))


def _to_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class _TransientError(Exception):
    def __init__(self, status_code: int) -> None:
        super().__init__(f"Audit service responded with status {status_code}.")
