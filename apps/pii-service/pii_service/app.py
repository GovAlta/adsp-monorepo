import atexit
import functools
import json
import logging
import os
from typing import Any, Dict, Optional
from uuid import uuid4
from adsp_service_flask_sdk import (
    AdspExtension,
    AdspRegistration,
    AuditAction,
    ConfigurationDefinition,
    ServiceRole,
    audit_details_from_request,
    request_user,
    require_user,
)
from dotenv import load_dotenv
from flask import Flask, Response, g, jsonify, request
from flask_cors import CORS
from pii_service.audit import (
    AUDIT_ACTIONS,
    RESOURCE_TYPE,
    TEXT_ANALYZE_ERRORED,
    TEXT_ANALYZE_FAILED,
    TEXT_ANALYZED,
    TEXT_ANONYMIZE_ERRORED,
    TEXT_ANONYMIZE_FAILED,
    TEXT_ANONYMIZED,
    get_calling_service,
    to_metadata,
)
from pii_service.recognizers.ca_bank_recognizer import CaBankRecognizer
from pii_service.recognizers.ca_passport_recognizer import CaPassportRecognizer
from pii_service.recognizers.ca_sin_recognizer import CaSinRecognizer
from presidio_analyzer.analyzer_engine import AnalyzerEngine
from presidio_analyzer.analyzer_request import AnalyzerRequest
from presidio_anonymizer import AnonymizerEngine
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import BadRequest
import yaml

from pii_service import service_roles
from pii_service.recognizers import CaPostalCodeRecognizer


load_dotenv()

logging.basicConfig()
logging.getLogger().setLevel(os.environ.get("LOG_LEVEL", "DEBUG"))


def convert_config(tenant_config, _) -> Dict[str, Any]:
    return tenant_config


adsp_extension = AdspExtension()
app = Flask(__name__)
CORS(app)

if __name__ != "__main__":
    gunicorn_logger = logging.getLogger("gunicorn.error")
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

proxy_count = int(os.environ.get("PROXY_COUNT", "2"))
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=proxy_count,
    x_proto=proxy_count,
    x_host=proxy_count,
    x_prefix=proxy_count,
)

adsp = adsp_extension.init_app(
    app,
    AdspRegistration(
        "PII service",
        "Service for analyzing and processing PII based on microsoft/presidio.",
        configuration=ConfigurationDefinition(
            "Configuration of the PII service.",
            {
                "type": "object",
            },
            convert_config,
        ),
        roles=[
            ServiceRole(
                service_roles.ANALYZER,
                "Analyzer role that allows user to make analyze requests.",
                in_tenant_admin=True
            )
        ],
        events=[],
        audit_actions=AUDIT_ACTIONS,
        api_endpoint_path="/pii/v1",
        docs_endpoint_path="/swagger/docs/v1",
    ),
    {
        "ADSP_ALLOW_CORE": True,
        "ADSP_ACCESS_SERVICE_URL": os.environ.get(
            "KEYCLOAK_ROOT_URL", "https://access.adsp-dev.gov.ab.ca"
        ),
        "ADSP_DIRECTORY_URL": os.environ.get(
            "DIRECTORY_URL", "https://directory-service.adsp-dev.gov.ab.ca"
        ),
        "ADSP_SERVICE_ID": os.environ.get("SERVICE_ID", "urn:ads:platform:pii-service"),
        "ADSP_CLIENT_SECRET": os.environ.get("CLIENT_SECRET"),
        "ADSP_AUDIT_ENABLED": os.environ.get("AUDIT_ENABLED", "true"),
    },
)

app.register_blueprint(adsp.metadata_blueprint)

analyzer_engine = AnalyzerEngine()
analyzer_engine.registry.add_recognizer(CaBankRecognizer())
analyzer_engine.registry.add_recognizer(CaPostalCodeRecognizer())
analyzer_engine.registry.add_recognizer(CaPassportRecognizer())
analyzer_engine.registry.add_recognizer(CaSinRecognizer())

anonymizer_engine = AnonymizerEngine()

atexit.register(adsp.audit_service.flush)


def audited(success_action: AuditAction, failure_action: AuditAction, error_action: AuditAction):
    """Audits the outcome of a request handler, without recording any request content.

    Client errors (4xx) are recorded as failures; any other exception is a service error with a higher severity.
    The handler records the non-sensitive details it knows in `g.audit`.
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            g.audit = {"correlation_id": str(uuid4())}
            try:
                result = func(*args, **kwargs)
            except Exception as err:
                if _is_client_error(err):
                    _record_audit(failure_action, "failure", type(err).__name__)
                else:
                    _record_audit(error_action, "error", type(err).__name__)
                raise
            _record_audit(success_action, "success")
            return result

        return wrapper

    return decorator


def _is_client_error(err: Exception) -> bool:
    code = getattr(err, "code", None)
    return isinstance(code, int) and 400 <= code < 500


def _record_audit(action: AuditAction, status: str, error_type: Optional[str] = None):
    details = g.audit
    correlation_id = details["correlation_id"]
    token = request.headers.get("Authorization", "")[7:] or None
    try:
        adsp.audit_service.record(
            action,
            audit_details_from_request(
                status=status,
                resource={"type": RESOURCE_TYPE, "id": correlation_id},
                correlation_id=correlation_id,
                metadata=to_metadata(
                    details.get("language"),
                    details.get("score_threshold"),
                    details.get("entities_detected"),
                    get_calling_service(request_user, token),
                    error_type,
                ),
            ),
        )
    except Exception as err:
        # Auditing must never fail the request.
        app.logger.warning("Failed to record audit event %s for %s. %s", action.name, correlation_id, err)


def _set_audit_request(analyzer_request: AnalyzerRequest):
    """Keeps the non-sensitive parameters of the request for auditing; never the text."""
    g.audit.update(
        language=analyzer_request.language,
        score_threshold=analyzer_request.score_threshold,
    )
    if analyzer_request.correlation_id:
        g.audit["correlation_id"] = str(analyzer_request.correlation_id)


@app.route("/pii/v1/entities", methods=["GET"])
@require_user(service_roles.ANALYZER, allow_core=True)
def supported_entities():
    language = request.args.get("language")
    entities_list = analyzer_engine.get_supported_entities(language)
    return jsonify(entities_list), 200


@app.route("/pii/v1/analyze", methods=["POST"])
@require_user(service_roles.ANALYZER, allow_core=True)
@audited(TEXT_ANALYZED, TEXT_ANALYZE_FAILED, TEXT_ANALYZE_ERRORED)
def analyze():
    analyzer_request = AnalyzerRequest(request.get_json())
    _set_audit_request(analyzer_request)

    if analyzer_request.language != "en":
        raise BadRequest("Only en is supported at this time")

    if not analyzer_request.text:
        raise BadRequest("No text provided")

    if not analyzer_request.language:
        raise BadRequest("No language provided")

    recognizer_result_list = analyzer_engine.analyze(
        text=analyzer_request.text,
        language=analyzer_request.language,
        correlation_id=analyzer_request.correlation_id,
        score_threshold=analyzer_request.score_threshold,
        entities=analyzer_request.entities,
        return_decision_process=analyzer_request.return_decision_process,
        # ad_hoc_recognizers=analyzer_request.ad_hoc_recognizers,
        context=analyzer_request.context,
    )
    g.audit["entities_detected"] = len(recognizer_result_list)

    return Response(
        json.dumps(
            recognizer_result_list,
            default=lambda o: o.to_dict(),
            sort_keys=True,
        ),
        content_type="application/json",
    )


@app.route("/pii/v1/anonymize", methods=["POST"])
@require_user(service_roles.ANALYZER, allow_core=True)
@audited(TEXT_ANONYMIZED, TEXT_ANONYMIZE_FAILED, TEXT_ANONYMIZE_ERRORED)
def anonymize():
    analyzer_request = AnalyzerRequest(request.get_json())
    _set_audit_request(analyzer_request)

    if analyzer_request.language != "en":
        raise BadRequest("Only en is supported at this time")

    if not analyzer_request.text:
        raise BadRequest("No text provided")

    if not analyzer_request.language:
        raise BadRequest("No language provided")

    recognizer_result_list = analyzer_engine.analyze(
        text=analyzer_request.text,
        language=analyzer_request.language,
        correlation_id=analyzer_request.correlation_id,
        score_threshold=analyzer_request.score_threshold,
        entities=analyzer_request.entities,
        return_decision_process=analyzer_request.return_decision_process,
        # ad_hoc_recognizers=analyzer_request.ad_hoc_recognizers,
        context=analyzer_request.context,
    )
    g.audit["entities_detected"] = len(recognizer_result_list)

    anonymizer_result = anonymizer_engine.anonymize(
        analyzer_request.text, recognizer_result_list
    )

    return Response(
        anonymizer_result.to_json(),
        content_type="application/json",
    )


@app.route("/swagger/docs/v1", methods=["GET"])
def apiDocs():
    docs = _load_api_docs()
    return Response(
        json.dumps(docs, default=lambda o: o.to_dict()), content_type="application/json"
    )


API_DOCS_ATTR = "_service_api_docs"


def _load_api_docs():
    api_docs = globals().get(API_DOCS_ATTR, None)
    if api_docs is None:
        dir_path = os.path.dirname(os.path.realpath(__file__))
        with open(os.path.join(dir_path, "resources", "swagger.yml"), "r") as docs_yml:
            api_docs = yaml.safe_load(docs_yml)
            globals()[API_DOCS_ATTR] = api_docs
    return api_docs
