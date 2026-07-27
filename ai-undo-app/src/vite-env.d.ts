/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_DEFAULT_REALM: string;
  readonly VITE_TENANT_API_URL: string;
  readonly VITE_AGENT_SERVICE_URL: string;
  readonly VITE_AGENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
