import axios from 'axios';
import { logger } from '../../../middleware/logger';
import { createkcAdminClient } from '../../../keycloak';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../../environments/environment';
export const FLOW_ALIAS = 'GOA SSO Login Flow';

export const createAuthenticationFlow = async (realm: string): Promise<void> => {
  logger.debug('Adding authentication flow to tenant public client...');

  const client = await createkcAdminClient();

  const flowAlias = FLOW_ALIAS;
  const authFlow = {
    id: uuidv4(),
    alias: flowAlias,
    realm,
    description:
      'An authentication flow that allows GOA SSO as new keycloak account or link to existing (usually Admin) account.',
    providerId: 'basic-flow',
    topLevel: true,
    builtIn: false,
  };

  await client.authenticationManagement.createFlow(authFlow);

  // Have issue of creating executions with the authentication flow. Add executions separately...
  const executionUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/authentication/flows/${flowAlias}/executions/execution`;
  const executionsUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/authentication/flows/${flowAlias}/executions`;

  // Can we preset the id here?
  const userExecution = {
    provider: 'idp-create-user-if-unique',
  };

  const idpLinkExecution = {
    provider: 'idp-auto-link',
  };

  const headers = {
    Authorization: `Bearer ${client.accessToken}`,
    'Content-Type': 'application/json',
  };

  await axios.post(executionUrl, userExecution, { headers });
  await axios.post(executionUrl, idpLinkExecution, { headers });

  // Note: tried to add requirement: 'ALTERNATIVE' in creation, but it does not work.
  const { data: executions } = await axios.get(executionsUrl, { headers });

  for (const execution of executions) {
    const updatePayload = {
      id: execution.id,
      requirement: 'ALTERNATIVE',
    };
    await axios.put(executionsUrl, updatePayload, { headers });
  }

  logger.info('Added authentication flow to tenant public client.');
};
