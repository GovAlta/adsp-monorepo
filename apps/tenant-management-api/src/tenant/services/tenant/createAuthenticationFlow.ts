import axios from 'axios';
import { logger } from '../../../middleware/logger';
import { createkcAdminClient } from '../../../keycloak';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../../environments/environment';
export const FLOW_ALIAS = 'GOA SSO Login Flow';

interface authConfig {
  id: string;
  alias: string;
  realm: string;
  description: string;
  providerId: string;
  topLevel: boolean;
  builtIn: boolean;
}

const createFlowExecutions = async (realm, flowAlias, token) => {
  const executionUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/authentication/flows/${flowAlias}/executions/execution`;
  const executionsUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/authentication/flows/${flowAlias}/executions`;
  const http = axios.create();

  // Can we preset the id here?
  const userExecution = {
    provider: 'idp-create-user-if-unique',
  };

  const idpLinkExecution = {
    provider: 'idp-auto-link',
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  await http.post(executionUrl, userExecution, { headers });
  await http.post(executionUrl, idpLinkExecution, { headers });
  // Note: tried to add requirement: 'ALTERNATIVE' in creation, but it does not work.
  const res = await http.get(executionsUrl, { headers });
  const executions = await res.data;

  for (const execution of executions) {
    const updatePayload = {
      id: execution.id,
      requirement: 'ALTERNATIVE',
    };
    await http.put(executionsUrl, updatePayload, { headers });
  }
};

export const creatFlowConfig = (realm: string, flowAlias: string, flowId: string): authConfig => {
  const config = {
    id: flowId,
    alias: flowAlias,
    realm: realm,
    description:
      'An authentication flow that allows GOA SSO as new keycloak account or link to existing (usually Admin) account.',
    providerId: 'basic-flow',
    topLevel: true,
    builtIn: false,
  };

  return config;
};

export const createAuthenticationFlow = async (realm: string): Promise<void> => {
  const client = await createkcAdminClient();

  logger.info('Added authentication flow to  tenant public client');
  const flowId = uuidv4();
  const authFlow = creatFlowConfig(realm, FLOW_ALIAS, flowId);
  await client.authenticationManagement.createFlow(authFlow);

  // Have issue of creating executions with the authentication flow and try to add executions separately
  await createFlowExecutions(realm, FLOW_ALIAS, client.accessToken);

  logger.info('Start to add authentication flow');
};

export function testCreateAuthenticationFlow(): boolean {
  return true;
}
