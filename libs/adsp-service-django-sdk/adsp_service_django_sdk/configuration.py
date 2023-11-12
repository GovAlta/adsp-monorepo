from typing import Any, Callable, Dict, Optional

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.configuration import TC, ConfigurationService

from .context import get_tenant


def create_get_configuration(
    configuration_service: ConfigurationService, default_service_id: AdspId
) -> Callable[[Any, Optional[AdspId]], TC]:
    def get_configuration(
        request: Any,
        service_id: Optional[AdspId] = default_service_id,
    ) -> Dict[str, Any]:
        service_id = service_id if service_id is not None else default_service_id
        request_tenant = get_tenant(request)
        tenant_id = request_tenant.id if request_tenant else None
        return configuration_service.get_configuration(service_id, tenant_id)

    return get_configuration
