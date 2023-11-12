from importlib import import_module
from os import environ
from typing import Any

from adsp_py_common.access import IssuerCache
from adsp_py_common.adsp_id import AdspId
from adsp_py_common.configuration import ConfigurationService
from adsp_py_common.constants import (
    CONFIG_ACCESS_URL,
    CONFIG_ALLOW_CORE,
    CONFIG_CLIENT_SECRET,
    CONFIG_DIRECTORY_URL,
    CONFIG_REALM,
    CONFIG_SERVICE_ID,
)
from adsp_py_common.directory import ServiceDirectory
from adsp_py_common.event import EventService
from adsp_py_common.registration import AdspRegistration, ServiceRegistrar
from adsp_py_common.tenant import TenantService
from adsp_py_common.token_provider import TokenProvider
from django.conf import settings, LazySettings


from .configuration import create_get_configuration
from .services import AdspServices

REGISTRATION_ENV_VARIABLE = "ADSP_REGISTRATION_MODULE"


class LazyAdspServices(AdspServices):
    _loaded = False

    @staticmethod
    def _import_registration() -> AdspRegistration:
        registration_module = environ.get(REGISTRATION_ENV_VARIABLE)
        registration = AdspRegistration()

        if registration_module:
            mod = import_module(registration_module)
            for setting in dir(mod):
                setting_value = getattr(mod, setting)
                if isinstance(setting_value, AdspRegistration):
                    registration = setting_value

        return registration

    def _create_services(
        self, config: LazySettings, registration: AdspRegistration
    ) -> AdspServices:
        access_url = getattr(config, CONFIG_ACCESS_URL, None)
        directory_url = getattr(config, CONFIG_DIRECTORY_URL, None)
        service_id_value = getattr(config, CONFIG_SERVICE_ID, None)
        client_secret = getattr(config, CONFIG_CLIENT_SECRET, None)
        realm = getattr(config, CONFIG_REALM, None)
        allow_core = getattr(config, CONFIG_ALLOW_CORE, False)

        if not access_url:
            raise ValueError(f"{CONFIG_ACCESS_URL} configuration value is required.")

        if not directory_url:
            raise ValueError(f"{CONFIG_DIRECTORY_URL} configuration value is required.")

        if not service_id_value:
            raise ValueError(f"{CONFIG_SERVICE_ID} configuration value is required.")

        if not client_secret:
            raise ValueError(f"{CONFIG_CLIENT_SECRET} configuration value is required.")

        service_id = AdspId.parse(service_id_value)

        directory = ServiceDirectory(directory_url)
        token_provider = TokenProvider(
            access_url, service_id, client_secret, realm or "core"
        )
        tenant_service = TenantService(directory, token_provider)
        issuer_cache = IssuerCache(access_url, tenant_service, allow_core)
        configuration_service = ConfigurationService(
            directory,
            token_provider,
            registration.configuration.convert_config
            if registration and registration.configuration
            else None,
        )
        get_configuration = create_get_configuration(configuration_service, service_id)

        event_service = EventService(
            service_id, directory, token_provider, registration
        )

        registrar = ServiceRegistrar(service_id, directory, token_provider)
        registrar.register(registration)

        self.service_id = service_id
        self.directory = directory
        self.token_provider = token_provider
        self.tenant_service = tenant_service
        self.configuration_service = configuration_service
        self.event_service = event_service
        self.get_configuration = get_configuration
        self.issuer_cache = issuer_cache
        self.registration = registration
        self._loaded = True

    def __getattr__(self, __name: str) -> Any:
        if not self._loaded:
            self._create_services(settings, self._import_registration())
        return super().__getattribute__(__name)


adsp: AdspServices = LazyAdspServices()
