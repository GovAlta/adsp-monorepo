import json
import logging
from os import environ
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
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.exceptions import BadRequest

from pii_service import service_roles
from pii_service.recognizers import CaPostalCodeRecognizer


load_dotenv()

logging.basicConfig()
logging.getLogger().setLevel(environ.get("LOG_LEVEL", "DEBUG"))


def convert_config(tenant_config, _) -> Dict[str, Any]:
    return tenant_config


adsp_extension = AdspExtension()
app = Flask(__name__)

if __name__ != "__main__":
    gunicorn_logger = logging.getLogger("gunicorn.error")
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=2, x_proto=2, x_host=2, x_prefix=2)

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
    ),
    {
        "ADSP_ACCESS_SERVICE_URL": environ.get(
            "KEYCLOAK_ROOT_URL", "https://access.adsp-dev.gov.ab.ca"
        ),
        "ADSP_DIRECTORY_URL": environ.get(
            "DIRECTORY_URL", "https://directory-service.adsp-dev.gov.ab.ca"
        ),
        "ADSP_SERVICE_ID": environ.get("SERVICE_ID", "urn:ads:platform:pii-service"),
        "ADSP_CLIENT_SECRET": environ.get("CLIENT_SECRET"),
    },
)

app.register_blueprint(adsp.metadata_blueprint)

engine = AnalyzerEngine()
engine.registry.add_recognizer(CaBankRecognizer())
engine.registry.add_recognizer(CaPostalCodeRecognizer())
engine.registry.add_recognizer(CaPassportRecognizer())
engine.registry.add_recognizer(CaSinRecognizer())


@app.route("/pii/v1/analyze", methods=["POST"])
@require_user(service_roles.ANALYZER)
def analyze():
    analyzer_request = AnalyzerRequest(request.get_json())

    if not analyzer_request.text:
        raise BadRequest("No text provided")

    if not analyzer_request.language:
        raise BadRequest("No language provided")

    recognizer_result_list = engine.analyze(
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


@app.route("/pii/v1/entities", methods=["GET"])
@require_user(service_roles.ANALYZER)
def supported_entities():
    language = request.args.get("language")
    entities_list = engine.get_supported_entities(language)
    return jsonify(entities_list), 200
