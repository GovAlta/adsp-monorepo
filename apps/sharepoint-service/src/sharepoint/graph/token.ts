import { AdspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { CredentialNotSetError, toSharePointError } from '../errors';
import { SharePointConnection } from '../types';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const EXPIRY_MARGIN_SECONDS = 60;

interface SecretSource {
  getSecret(tenantId: AdspId, connectionId: string): Promise<string | null>;
}

export class GraphTokenProvider {
  private cache = new Map<string, { token: string; expiresAt: number }>();

  constructor(
    private authorityUrl: string,
    private secrets: SecretSource,
    private now: () => number = Date.now,
  ) {}

  private cacheKey(tenantId: AdspId, connectionId: string): string {
    return `${tenantId.toString()}|${connectionId}`;
  }

  async getToken(tenantId: AdspId, connection: SharePointConnection): Promise<string> {
    const key = this.cacheKey(tenantId, connection.id);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.now()) {
      return cached.token;
    }

    const secret = await this.secrets.getSecret(tenantId, connection.id);
    if (!secret) {
      throw new CredentialNotSetError(connection.id);
    }

    try {
      const { data } = await axios.post<{ access_token: string; expires_in: number }>(
        new URL(`/${encodeURIComponent(connection.entraTenantId)}/oauth2/v2.0/token`, this.authorityUrl).href,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: connection.clientId,
          client_secret: secret,
          scope: GRAPH_SCOPE,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      this.cache.set(key, {
        token: data.access_token,
        expiresAt: this.now() + (data.expires_in - EXPIRY_MARGIN_SECONDS) * 1000,
      });
      return data.access_token;
    } catch (err) {
      throw toSharePointError(err);
    }
  }

  evict(tenantId: AdspId, connectionId: string): void {
    this.cache.delete(this.cacheKey(tenantId, connectionId));
  }
}
