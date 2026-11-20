import { AdspId } from '@abgov/adsp-service-sdk';
import { SharePointError } from './errors';
import { GraphTokenProvider } from './graph';
import { SharePointConnection } from './types';

const REJECTED_TOKEN_CODE = 'graph:InvalidAuthenticationToken';

// A cached token can be rejected early, for example after the secret changed; retry once with a new one.
export async function withToken<T>(
  tokens: GraphTokenProvider,
  tenantId: AdspId,
  connection: SharePointConnection,
  call: (token: string) => Promise<T>,
): Promise<T> {
  try {
    return await call(await tokens.getToken(tenantId, connection));
  } catch (err) {
    if (!(err instanceof SharePointError) || err.errorCode !== REJECTED_TOKEN_CODE) {
      throw err;
    }
    tokens.evict(tenantId, connection.id);
    return call(await tokens.getToken(tenantId, connection));
  }
}
