import axios from 'axios';
import type { Request } from 'express';
import * as NodeCache from 'node-cache';
import { JwksClient } from 'jwks-rsa';
import jwtDecode from 'jwt-decode';
import type { Logger } from 'winston';
import { IssuerCache } from './issuerCache';

type DoneCallback = (error: Error, result?: string) => void;
type SecretCallback = (req: Request, token: string, done: DoneCallback) => Promise<void>;

export class TenantKeyProvider {
  private readonly LOG_CONTEXT = { context: 'TenantKeyProvider' };

  #clientCache = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly accessServiceUrl: URL,
    private readonly issuerCache: IssuerCache
  ) {}

  #createJwksClient = async (iss: string): Promise<JwksClient> => {
    this.logger.debug(`Creating JWKS client for iss '${iss}'...'`, this.LOG_CONTEXT);

    const tenant = await this.issuerCache.getTenantByIssuer(iss);
    if (!tenant) {
      throw new Error(`Cannot find tenant associated with iss: ${iss}`);
    } else {
      const oidcUrl = new URL(`/auth/realms/${tenant.realm}/.well-known/openid-configuration`, this.accessServiceUrl);
      const { data } = await axios.get<{ issuer: string; jwks_uri: string }>(oidcUrl.href);
      if (data.issuer !== iss) {
        throw new Error(
          `Tenant '${tenant.id}' realm '${tenant.realm}' openid-configuration response not consistent with token iss value.`
        );
      }

      const client = new JwksClient({
        jwksUri: data.jwks_uri,
        cache: true,
        strictSsl: true,
      });

      this.#clientCache.set(iss, client);

      this.logger.info(`Created and cached JWKS client for iss '${iss}'.'`, this.LOG_CONTEXT);

      return client;
    }
  };

  keyRequestHandler: SecretCallback = async (_req, token, done) => {
    try {
      const { kid } = jwtDecode<{ kid: string }>(token, { header: true });
      const { iss } = jwtDecode<{ iss: string }>(token);

      this.logger.debug(`Decoded JWT from request with iss '${iss}' and kid '${kid}'...`, this.LOG_CONTEXT);

      const client = this.#clientCache.get<JwksClient>(iss) || (await this.#createJwksClient(iss));

      this.logger.debug(`Retrieving public key from JWKS client...'`, this.LOG_CONTEXT);

      client.getSigningKey(kid, (err, key) => {
        if (err) {
          this.logger.error(`Error encountered in request to JWKS client. ${err}`, this.LOG_CONTEXT);
        }
        done(err, key?.getPublicKey());
      });
    } catch (err) {
      this.logger.error(`Error encountered verifying token signature. ${err}`);
      done(err);
    }
  };
}
