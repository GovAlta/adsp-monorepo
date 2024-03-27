import json
import logging
import os
from typing import Any, Dict
from adsp_service_flask_sdk import (
    AdspExtension,
    AdspRegistration,
    ConfigurationDefinition,
    ServiceRole,
    require_user,
)
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
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
            )
        ],
        events=[],
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
    },
)

app.register_blueprint(adsp.metadata_blueprint)

analyzer_engine = AnalyzerEngine()
analyzer_engine.registry.add_recognizer(CaBankRecognizer())
analyzer_engine.registry.add_recognizer(CaPostalCodeRecognizer())
analyzer_engine.registry.add_recognizer(CaPassportRecognizer())
analyzer_engine.registry.add_recognizer(CaSinRecognizer())

anonymizer_engine = AnonymizerEngine()


@app.route("/pii/v1/entities", methods=["GET"])
@require_user(service_roles.ANALYZER, allow_core=True)
def supported_entities():
    language = request.args.get("language")
    entities_list = analyzer_engine.get_supported_entities(language)
    return jsonify(entities_list), 200


@app.route("/pii/v1/analyze", methods=["POST"])
@require_user(service_roles.ANALYZER, allow_core=True)
def analyze():
    analyzer_request = AnalyzerRequest(request.get_json())

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
def anonymize():
    analyzer_request = AnalyzerRequest(request.get_json())

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
