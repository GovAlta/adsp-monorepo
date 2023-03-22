from urllib.parse import urlparse

from flask import Blueprint, jsonify, request

from .adsp_id import AdspId
from .registration import AdspRegistration


def create_metadata_blueprint(service_id: AdspId, registration: AdspRegistration):
    metadata_blueprint = Blueprint("adsp_metadata", __name__)
    display_name, description, *_ = registration

    @metadata_blueprint.route("/")
    def get_metadata():
        request_url = urlparse(request.url)
        links = {"self": request.url}

        if registration.health_endpoint_path:
            links[
                "health"
            ] = f"{request_url.scheme}://{request_url.netloc}{registration.health_endpoint_path}"

        if registration.docs_endpoint_path:
            links[
                "docs"
            ] = f"{request_url.scheme}://{request_url.netloc}{registration.docs_endpoint_path}"

        return jsonify(
            {
                "name": display_name or service_id.service,
                "description": description,
                "_links": links,
            }
        )

    return metadata_blueprint
