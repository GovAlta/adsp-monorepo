from typing import Any, Callable, Dict, NamedTuple, Optional
from adsp_service_flask_sdk.event import EventService

from flask import Blueprint, Flask

from ._constants import (
    CONFIG_ACCESS_URL,
    CONFIG_ALLOW_CORE,
    CONFIG_CLIENT_SECRET,
    CONFIG_DIRECTORY_URL,
    CONFIG_REALM,
    CONFIG_SERVICE_ID,
)
from .access import IssuerCache
from .adsp_id import AdspId
from .configuration import TC, ConfigurationService, create_get_configuration
from .directory import ServiceDirectory
from .filter import AccessRequestFilter, TenantRequestFilter
from .metadata import create_metadata_blueprint
from .registration import AdspRegistration, ServiceRegistrar
from .tenant import TenantService
from .token_provider import TokenProvider


class AdspServices(NamedTuple):
    directory: ServiceDirectory
    token_provider: TokenProvider
    tenant_service: TenantService
    configuration_service: ConfigurationService
    get_configuration: Callable[[Optional[AdspId]], TC]
    event_service: EventService
    metadata_blueprint: Blueprint


class AdspExtension:
    def init_app(
        self,
        app: Flask,
        registration: AdspRegistration,
        config: Optional[Dict[str, Any]] = None,
    ) -> AdspServices:
        base_config = app.config.copy()
        if config:
            base_config.update(config)
        config = base_config

        access_url = config.get(CONFIG_ACCESS_URL)
        directory_url = config.get(CONFIG_DIRECTORY_URL)
        service_id_value = config.get(CONFIG_SERVICE_ID)
        client_secret = config.get(CONFIG_CLIENT_SECRET)
        realm = config.get(CONFIG_REALM)
        allow_core = config.get(CONFIG_ALLOW_CORE, False)

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
        metadata_blueprint = create_metadata_blueprint(service_id, registration)

        access_filter = AccessRequestFilter(service_id, issuer_cache)
        tenant_filter = TenantRequestFilter(tenant_service)

        app.before_request(access_filter.filter)
        app.before_request(tenant_filter.filter)

        app.extensions["adsp_extension"] = self
        return AdspServices(
            directory,
            token_provider,
            tenant_service,
            configuration_service,
            get_configuration,
            event_service,
            metadata_blueprint,
        )
