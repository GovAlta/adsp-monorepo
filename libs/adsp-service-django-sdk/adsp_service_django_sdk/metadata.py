from django.http import HttpResponse
from urllib.parse import urlparse

from ._setup import adsp


def get_metadata(request):
    (
        service_id,
        display_name,
        description,
    ) = adsp.registration
    request_url = urlparse(request.url)
    links = {"self": request.url}

    if adsp.registration.health_endpoint_path:
        links[
            "health"
        ] = f"{request_url.scheme}://{request_url.netloc}{adsp.registration.health_endpoint_path}"

    if adsp.registration.docs_endpoint_path:
        links[
            "docs"
        ] = f"{request_url.scheme}://{request_url.netloc}{adsp.registration.docs_endpoint_path}"

    if adsp.registration.api_endpoint_path:
        links[
            "api"
        ] = f"{request_url.scheme}://{request_url.netloc}{adsp.registration.api_endpoint_path}"

    return HttpResponse(
        {
            "name": display_name or service_id.service,
            "description": description,
            "_links": links,
        }
    )
