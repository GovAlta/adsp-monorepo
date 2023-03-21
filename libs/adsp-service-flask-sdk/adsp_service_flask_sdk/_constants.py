from .adsp_id import AdspId


CONTEXT_USER = '_adsp_user'
CONTEXT_TENANT = '_adsp_tenant'

CONFIG_SERVICE_ID = 'ADSP_SERVICE_ID'
CONFIG_CLIENT_SECRET = 'ADSP_CLIENT_SECRET'
CONFIG_REALM = 'ADSP_REALM'
CONFIG_ACCESS_URL = 'ADSP_ACCESS_SERVICE_URL'
CONFIG_DIRECTORY_URL = 'ADSP_DIRECTORY_URL'
CONFIG_ALLOW_CORE = 'ADSP_ALLOW_CORE'
PLATFORM_CONFIGURATION_API = AdspId.parse("urn:ads:platform:configuration-service:v2")
PLATFORM_TENANT_API = AdspId.parse("urn:ads:platform:tenant-service:v2")
PLATFORM_EVENT_API = AdspId.parse("urn:ads:platform:event-service:v1")
PLATFORM_CONFIGURATION_SERVICE = AdspId.parse("urn:ads:platform:configuration-service")
PLATFORM_TENANT_SERVICE = AdspId.parse("urn:ads:platform:tenant-service")
PLATFORM_EVENT_SERVICE = AdspId.parse("urn:ads:platform:event-service")
