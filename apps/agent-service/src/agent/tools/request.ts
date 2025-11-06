import { adspId, AdspId, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { createTool } from '@mastra/core';
import axios, { isAxiosError } from 'axios';
import { parseTemplate } from 'url-template';
import { Logger } from 'winston';
import { ApiRequestToolConfiguration } from '../configuration';

interface ApiToolProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}
export function createApiRequestTool(
  { logger, directory, tokenProvider }: ApiToolProps,
  { id, description, api, path, method, inputSchema, outputSchema, userContext }: ApiRequestToolConfiguration
) {
  let apiId: AdspId;
  if (!AdspId.isAdspId(api) || (apiId = AdspId.parse(api)).type !== 'api') {
    throw new InvalidOperationError('Configured api value must be an ADSP URN for an API.');
  }

  const pathTemplate = parseTemplate(path);

  return createTool({
    id,
    description,
    // Mastra appears able to handle a json schema instead of a zod schema...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputSchema: inputSchema as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputSchema: outputSchema as any,
    execute: async ({ context, runtimeContext }) => {
      const tenantId = runtimeContext.get('tenantId') as AdspId;
      const user = runtimeContext.get('user') as User;

      logger.debug(`Tool '${id}' ${method} request to ${apiId}:${path}...`, {
        context: 'ApiRequestTool',
        tenant: tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      try {
        const { tenantId: _t, user: _u, ...additionalContext } = runtimeContext.toJSON();
        const resourceId = adspId`${api}:${pathTemplate.expand({ ...context, ...additionalContext })}`;
        const resourceUrl = await directory.getResourceUrl(resourceId);

        const params = {
          ...(method === 'GET' ? context : {}),
          tenantId: tenantId.toString(),
        };

        const requestData = {
          ...(method !== 'GET' ? context : {}),
        };

        const token = userContext ? user.token.bearer : await tokenProvider.getAccessToken();
        const { data } = await axios.request({
          method,
          url: resourceUrl.href,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: requestData,
          params,
        });

        logger.info(`Tool '${id}' executed ${method} request to ${resourceUrl}.`, {
          context: 'ApiRequestTool',
          tenant: tenantId.toString(),
          user: `${user.name} (ID: ${user.id})`,
        });

        return data;
      } catch (err) {
        logger.warn(
          `Error encountered for tool '${id}' ${method} request to ${apiId}:${path}: ${
            isAxiosError(err) && typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err
          }`,
          {
            context: 'ApiRequestTool',
            tenant: tenantId.toString(),
            user: `${user.name} (ID: ${user.id})`,
          }
        );
        throw err;
      }
    },
  });
}
