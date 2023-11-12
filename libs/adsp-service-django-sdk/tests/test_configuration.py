from unittest.mock import Mock, patch

from adsp_py_common.adsp_id import AdspId
from adsp_py_common.configuration import ConfigurationService
from adsp_py_common.constants import CONTEXT_TENANT
from adsp_py_common.tenant import Tenant
from adsp_service_django_sdk.configuration import create_get_configuration


def test_create_get_configuration():
    configuration_service = Mock(ConfigurationService)
    get_configuration = create_get_configuration(
        configuration_service, AdspId.parse("urn:ads:platform:tenant-service")
    )
    assert get_configuration


def test_get_configuration_context():
    tenant = Tenant(
        AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        "test",
        "test_realm",
        "test@test.co",
    )
    service_id = AdspId.parse("urn:ads:platform:tenant-service")
    with patch("adsp_service_django_sdk.configuration.get_tenant") as mock_get_tenant:
        mock_get_tenant.return_value = tenant
        configuration_service = Mock(ConfigurationService)
        get_configuration = create_get_configuration(configuration_service, service_id)

        configuration = {"testing": 123}
        configuration_service.get_configuration.return_value = (configuration, {})
        request = {CONTEXT_TENANT: tenant}
        tenant_config, core_config = get_configuration(request)
        assert tenant_config
        assert tenant_config["testing"] == 123
        assert core_config is not None
        assert not core_config
        mock_get_tenant.assert_called_once_with(request)
        configuration_service.get_configuration.assert_called_once_with(
            service_id, tenant.id
        )
