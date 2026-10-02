import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
from unittest.mock import Mock, patch

import pytest
from adsp_py_common.adsp_id import AdspId
from adsp_py_common.access import IssuerCache, _JWKClient
from adsp_py_common.tenant import Tenant, TenantService
from httpx import Response, RequestError
from jwt import PyJWKClientError

tenant_id = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test")


def test_get_issuer():
    with patch("adsp_py_common.access.get") as mock_get:
        iss = "https://access-service/auth/realms/test_realm"
        tenant_id = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/test")
        tenant_service = Mock(TenantService)
        tenant_service.get_tenants.return_value = {
            tenant_id: Tenant(
                tenant_id,
                "test",
                "test_realm",
                "test@test.co",
            )
        }
        cache = IssuerCache("https://access-service", tenant_service)

        response = Mock(Response)
        response.json.return_value = {
            "issuer": iss,
            "jwks_uri": "https://access-service/auth/realms/test_realm/certs",
        }
        mock_get.return_value = response
        issuer = cache.get_issuer(iss)
        assert issuer
        assert issuer.iss == iss


def test_get_issuer_allow_core():
    with patch("adsp_py_common.access.get") as mock_get:
        iss = "https://access-service/auth/realms/core"
        tenant_service = Mock(TenantService)
        tenant_service.get_tenants.return_value = {}
        cache = IssuerCache("https://access-service", tenant_service, True)

        response = Mock(Response)
        response.json.return_value = {
            "issuer": iss,
            "jwks_uri": "https://access-service/auth/realms/core/certs",
        }
        mock_get.return_value = response
        issuer = cache.get_issuer(iss)
        assert issuer
        assert issuer.iss == iss


def test_get_issuer_request_error():
    missing_tenant_id = AdspId.parse(
        "urn:ads:platform:tenant-service:v2:/tenants/test2"
    )
    with patch("adsp_py_common.access.get") as mock_get:
        iss = "https://access-service/auth/realms/core"
        tenant_service = Mock(TenantService)
        tenant_service.get_tenants.return_value = {
            tenant_id: Tenant(
                tenant_id,
                "test",
                "test_realm",
                "test@test.co",
            ),
            missing_tenant_id: Tenant(
                missing_tenant_id,
                "test2",
                "test_realm",
                "test@test.co",
            ),
        }
        cache = IssuerCache("https://access-service", tenant_service, True)

        response = Mock(Response)
        response.json.return_value = {
            "issuer": iss,
            "jwks_uri": "https://access-service/auth/realms/test_realm/certs",
        }
        mock_get.side_effect = [response, RequestError("Oh noes!")]

        issuer = cache.get_issuer(iss)
        assert issuer
        assert issuer.iss == iss


class _JwksHandler(BaseHTTPRequestHandler):
    user_agents = []

    def do_GET(self):
        _JwksHandler.user_agents.append(self.headers.get("User-Agent"))
        if self.path == "/redirect":
            self.send_response(302)
            self.send_header("Location", "/certs")
            self.end_headers()
            return
        body = json.dumps(
            {"keys": [{"kty": "oct", "kid": "test", "use": "sig", "k": "c2VjcmV0"}]}
        ).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


@pytest.fixture
def jwks_server():
    _JwksHandler.user_agents = []
    server = HTTPServer(("127.0.0.1", 0), _JwksHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown()
    server.server_close()


def test_jwk_client_sends_blank_user_agent(jwks_server):
    client = _JWKClient(f"{jwks_server}/certs")
    key = client.get_signing_key("test")
    assert key.key_id == "test"
    assert _JwksHandler.user_agents == [""]


def test_jwk_client_does_not_follow_redirects(jwks_server):
    client = _JWKClient(f"{jwks_server}/redirect")
    with pytest.raises(PyJWKClientError):
        client.get_signing_key("test")
    assert _JwksHandler.user_agents == [""]
