import {
  getAccessToken,
  getDirectoryServiceUrl,
  getServiceConfigurationSchemas,
  HttpRequestError,
  ServiceNotInDirectoryError,
} from '@abgov/adsp-cli';
import { LiveToolDefinition } from './types';

function describeError(err: unknown): string {
  if (err instanceof ServiceNotInDirectoryError) {
    return err.message;
  }

  if (err instanceof HttpRequestError) {
    if (err.status === 401) {
      return 'Access token was rejected (401). Run `npx @abgov/adsp-cli login` again to refresh it.';
    }
    if (err.status === 403) {
      return (
        'Access denied (403) reading configuration-service schemas. This is more likely the wrong tenant realm ' +
        'or environment than a missing role — check ADSP_TENANT_REALM and ADSP_ENV.'
      );
    }
    if (err.status >= 500) {
      return `The ADSP platform returned an error (${err.status}). It may be experiencing an outage — try again shortly.`;
    }
    return `Request failed with status ${err.status}.`;
  }

  if (err instanceof TypeError) {
    return `Could not reach the ADSP platform (${err.message}). Check ADSP_ENV/ADSP_DIRECTORY_SERVICE_URL and your network connection.`;
  }

  return err instanceof Error ? err.message : String(err);
}

export function createConfigurationSchemaTools(): LiveToolDefinition[] {
  return [
    {
      name: 'get_service_configuration_schema',
      description:
        'Returns the configuration schema(s) for ADSP platform services, read live from configuration-service. ' +
        'Use this to determine the correct shape for `serviceConfigurations` entries in `initializeService` when ' +
        'registering with a service that does not have a named field in `ServiceRegistration` (e.g. form-service, ' +
        'task-service). Pass a `serviceId` URN to get one service\'s schema; omit to list all registered schemas. ' +
        'Requires authentication: run `npx @abgov/adsp-cli login` once in a terminal (interactive), or set ' +
        'ADSP_CLIENT_ID and ADSP_CLIENT_SECRET environment variables for non-interactive/CI use.',
      inputSchema: {
        type: 'object',
        properties: {
          serviceId: {
            type: 'string',
            description: 'Optional ADSP service URN to filter to (e.g. "urn:ads:platform:form-service").',
          },
        },
      },
      handler: async (args: { serviceId?: string }) => {
        const tokenResult = await getAccessToken();

        if (tokenResult.status === 'not-authenticated') {
          return {
            isError: true,
            content: [
              { type: 'text', text: 'Not authenticated. Run `npx @abgov/adsp-cli login` in a terminal, then retry.' },
            ],
          };
        }

        try {
          const directoryServiceUrl = getDirectoryServiceUrl();
          const schemas = await getServiceConfigurationSchemas(
            tokenResult.token,
            directoryServiceUrl,
            args.serviceId
          );
          return {
            content: [{ type: 'text', text: JSON.stringify(schemas, null, 2) }],
          };
        } catch (err) {
          return { isError: true, content: [{ type: 'text', text: describeError(err) }] };
        }
      },
    },
  ];
}
