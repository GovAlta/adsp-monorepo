from typing import Any, Callable, Optional

from adsp_py_common.access import IssuerCache
from adsp_py_common.adsp_id import AdspId
from adsp_py_common.configuration import TC, ConfigurationService
from adsp_py_common.directory import ServiceDirectory
from adsp_py_common.event import EventService
from adsp_py_common.registration import AdspRegistration
from adsp_py_common.tenant import TenantService
from adsp_py_common.token_provider import TokenProvider


class AdspServices:
    service_id: AdspId
    directory: ServiceDirectory
    token_provider: TokenProvider
    tenant_service: TenantService
    configuration_service: ConfigurationService
    event_service: EventService
    get_configuration: Callable[[Any, Optional[AdspId]], TC]
    issuer_cache: IssuerCache
    registration: AdspRegistration
