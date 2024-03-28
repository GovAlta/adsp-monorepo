from adsp_py_common.adsp_id import AdspId
from adsp_py_common.registration import AdspRegistration
from flask import Blueprint, jsonify, request
from urllib.parse import urlparse


def create_metadata_blueprint(service_id: AdspId, registration: AdspRegistration):
    metadata_blueprint = Blueprint("adsp_metadata", __name__)
    display_name, description, *_ = registration

    @metadata_blueprint.route("/")
    def get_metadata():
        request_url = urlparse(request.url)
        links = {"self": {"href": request.url}}

        if registration.health_endpoint_path:
            links["health"] = {
                "href": f"{request_url.scheme}://{request_url.netloc}{registration.health_endpoint_path}"
            }

        if registration.docs_endpoint_path:
            links["docs"] = {
                "href": f"{request_url.scheme}://{request_url.netloc}{registration.docs_endpoint_path}"
            }

        if registration.api_endpoint_path:
            links["api"] = {
                "href": f"{request_url.scheme}://{request_url.netloc}{registration.api_endpoint_path}"
            }

        return jsonify(
            {
                "name": display_name or service_id.service,
                "description": description,
                "_links": links,
            }
        )

    return metadata_blueprint
