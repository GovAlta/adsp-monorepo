from django.http import JsonResponse

from ._setup import adsp


def get_metadata(request):
    service_id, display_name, description, *_ = adsp.registration
    links = {"self": {"href": request.build_absolute_uri()}}

    if adsp.registration.health_endpoint_path:
        links["health"] = {
            "href": request.build_absolute_uri(adsp.registration.health_endpoint_path)
        }

    if adsp.registration.docs_endpoint_path:
        links["docs"] = {
            "href": request.build_absolute_uri(adsp.registration.docs_endpoint_path)
        }

    if adsp.registration.api_endpoint_path:
        links["api"] = {
            "href": request.build_absolute_uri(adsp.registration.api_endpoint_path)
        }

    return JsonResponse(
        {
            "name": display_name or service_id.service,
            "description": description,
            "_links": links,
        }
    )
