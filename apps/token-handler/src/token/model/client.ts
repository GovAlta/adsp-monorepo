import { AdspId, LimitToOne, ServiceDirectory, Tenant } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import axios, { isAxiosError } from 'axios';
import { Request, RequestHandler } from 'express';
import jwtDecode from 'jwt-decode';
import { PassportStatic, Strategy } from 'passport';
import { Strategy as OidcStrategy } from 'passport-openidconnect';
import * as qs from 'qs';
import { Logger } from 'winston';

import { ClientCredentialRepository } from '../repository';
import { Client, ClientCredentials, Prompt, UserSessionData } from '../types';
import { generateCsrfToken } from '../csrf';
import { TargetProxy } from './target';

interface OidcClientRegistrationResponse {
  client_id: string;
  client_secret: string;
  registration_client_uri: string;
  registration_access_token: string;
}

interface OidcTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export class AuthenticationClient {
  tenantId: AdspId;
  id: string;
  name: string;
  prompt: Prompt;
  scope: string | string[];
  idpHint: string;
  authCallbackUrl: string;
  disableVerifyHost: boolean;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  targets: Record<string, TargetProxy>;
  credentials?: ClientCredentials;
  private strategy: Strategy;
  private callbackUrl: URL;

  constructor(
    private accessServiceUrl: URL,
    private logger: Logger,
    directory: ServiceDirectory,
    private repository: ClientCredentialRepository,
    client: Client
  ) {
    this.tenantId = client.tenantId;
    this.id = client.id;
    this.name = client.name;
    this.prompt = client.prompt;
    this.scope = client.scope;
    this.idpHint = client.idpHint;
    this.authCallbackUrl = client.authCallbackUrl;
    this.disableVerifyHost = !!client.disableVerifyHost;
    this.successRedirectUrl = client.successRedirectUrl || '/';
    this.failureRedirectUrl = client.failureRedirectUrl || '/';
    this.targets = Object.entries(client.targets).reduce(
      (targets, [targetId, target]) => ({ ...targets, [targetId]: new TargetProxy(logger, this, directory, target) }),
      {}
    );
    this.callbackUrl = new URL(this.authCallbackUrl);
  }

  public async register(tenant: Tenant, registrationToken: string) {
    this.logger.debug(`Registering client ${this.id}...`, {
      context: 'ClientRegistrationEntity',
      tenant: this.tenantId.toString(),
    });

    try {
      const { data } = await axios.post<OidcClientRegistrationResponse>(
        new URL(`/auth/realms/${tenant.realm}/clients-registrations/openid-connect`, this.accessServiceUrl).href,
        {
          client_name: this.id,
          token_endpoint_auth_method: 'client_secret_basic',
          grant_types: ['authorization_code', 'refresh_token'],
          redirect_uris: [this.authCallbackUrl],
        },
        { headers: { Authorization: `Bearer ${registrationToken}` } }
      );

      const original = await this.getCredentials();
      const credentials = {
        realm: tenant.realm,
        clientId: data.client_id,
        clientSecret: data.client_secret,
        registrationUrl: data.registration_client_uri,
        registrationToken: data.registration_access_token,
      };

      this.credentials = await this.repository.save(this, credentials);

      this.logger.info(
        `Registered client ${this.id} on client ID ${this.credentials.clientId} and registration URL: ${this.credentials.registrationUrl}.`,
        {
          context: 'ClientRegistrationEntity',
          tenant: this.tenantId.toString(),
        }
      );

      if (original) {
        // Delete the existing client if it exists.
        try {
          await axios.delete(original.registrationUrl, {
            headers: { Authorization: `Bearer ${original.registrationToken}` },
          });
          this.strategy = null;
        } catch (err) {
          this.logger.warn(
            `Delete of existing client registration at "${original.registrationUrl}" failed with error: ${err}`,
            { context: 'ClientRegistrationEntity', tenant: this.tenantId.toString() }
          );
        }
      }

      return this.credentials;
    } catch (err) {
      if (isAxiosError(err) && err.response.status === 401) {
        throw new InvalidOperationError('Registration request failed. Verify registration token.');
      } else {
        throw err;
      }
    }
  }

  private async getCredentials(): Promise<ClientCredentials> {
    // Lazy load credentials from repository.
    // Note: This object is cached as configuration and update of credentials is handled via cache invalidation.
    if (!this.credentials) {
      this.credentials = await this.repository.get(this);
    }

    return this.credentials;
  }

  verify = (
    _iss,
    profile: Record<string, unknown>,
    _context,
    _idToken,
    accessToken: string,
    refreshToken: string,
    verified
  ) => {
    try {
      const { sub, exp, realm_access, resource_access } = jwtDecode<{
        sub: string;
        exp: number;
        realm_access?: { roles: string[] };
        resource_access?: Record<string, { roles: string[] }>;
      }>(accessToken);
      const { exp: refreshExp } = jwtDecode<{ exp: number }>(refreshToken);

      verified(null, {
        id: sub,
        tenantId: this.tenantId,
        isCore: false,
        token: null,
        name: profile.displayName || profile.username,
        email: profile['emails']?.[0].value,
        accessToken,
        refreshToken,
        exp,
        refreshExp,
        authenticatedBy: this.id,
        roles: [
          ...(realm_access?.roles || []),
          ...Object.entries(resource_access || {}).reduce(
            (resourceRoles, [resource, { roles }]) => [...resourceRoles, ...roles.map((role) => `${resource}:${role}`)],
            []
          ),
        ],
      } as UserSessionData);
    } catch (err) {
      verified(err);
    }
  };

  private async getStrategy(): Promise<Strategy> {
    // Lazy create the strategy;
    if (!this.strategy) {
      const credentials = await this.getCredentials();
      if (!credentials) {
        throw new InvalidOperationError('Cannot use client to authenticate before registration.');
      }

      this.strategy = new OidcStrategy(
        {
          issuer: new URL(`/auth/realms/${credentials.realm}`, this.accessServiceUrl).href,
          authorizationURL: new URL(
            `/auth/realms/${credentials.realm}/protocol/openid-connect/auth${
              this.idpHint ? `?kc_idp_hint=${this.idpHint}` : ''
            }`,
            this.accessServiceUrl
          ).href,
          tokenURL: new URL(`/auth/realms/${credentials.realm}/protocol/openid-connect/token`, this.accessServiceUrl)
            .href,
          userInfoURL: new URL(
            `/auth/realms/${credentials.realm}/protocol/openid-connect/userinfo`,
            this.accessServiceUrl
          ).href,
          clientID: credentials.clientId,
          clientSecret: credentials.clientSecret,
          callbackURL: this.callbackUrl.href,
          prompt: this.prompt,
          scope: this.scope,
        },
        this.verify
      );
    }

    return this.strategy;
  }

  public async authenticate(passport: PassportStatic, complete = false): Promise<RequestHandler> {
    this.logger.debug(`${complete ? 'Complete' : 'Initiate'} authentication request on client ${this.id}...`, {
      context: 'AuthenticationClient',
      tenant: this.tenantId?.toString(),
    });

    const strategy = await this.getStrategy();
    const authenticateHandler = passport.authenticate(strategy, {
      failureRedirect: this.failureRedirectUrl,
    });

    return (req, res, next) => {
      if (!this.disableVerifyHost && req.hostname !== this.callbackUrl.hostname) {
        throw new InvalidOperationError('Request not to allowed host.');
      }

      authenticateHandler(
        req,
        res,
        complete
          ? () => {
              try {
                // Set the maxAge based on the expiry time of the refresh token.
                const { id, name, refreshExp } = req.user as UserSessionData;
                req.session.cookie.maxAge = (refreshExp - 60) * 1000 - Date.now();

                this.logger.info(
                  `Authenticated user '${name}' (ID: ${id}) on client '${this.id}' (clientID: ${this.credentials?.clientId}).`,
                  {
                    context: 'AuthenticationClient',
                    tenant: this.tenantId?.toString(),
                  }
                );
                generateCsrfToken(req, res);
                next();
              } catch (err) {
                this.logger.warn(
                  `Error encountered setting CSRF token on authenticated user: ${err}. Terminating session.`
                );

                req.logout((logoutErr) => {
                  if (!logoutErr) {
                    this.logger.info(`Ended session for user (ID: ${req.user?.id}).`, {
                      context: 'ClientRegistrationEntity',
                      tenant: this.tenantId.toString(),
                    });
                  } else {
                    this.logger.warn(`Error encountered ending session for user (ID: ${req.user?.id}): ${logoutErr}`, {
                      context: 'ClientRegistrationEntity',
                      tenant: this.tenantId.toString(),
                    });
                  }
                  next(err);
                });
              }
            }
          : next
      );
    };
  }

  @LimitToOne((propertyKey, req: Request) => `${propertyKey}-${req.sessionID}`)
  public async refreshTokens(req: Request): Promise<string> {
    this.logger.debug(`Refreshing token for user (ID: ${req.user?.id}) on session (ID: ${req.sessionID})...`, {
      context: 'ClientRegistrationEntity',
      tenant: this.tenantId.toString(),
    });

    try {
      const { refreshToken } = req.user as UserSessionData;
      const credentials = await this.getCredentials();
      if (!credentials) {
        throw new UnauthorizedError('Not authorized to make request.');
      }

      const { data } = await axios.post<OidcTokenResponse>(
        new URL(`/auth/realms/${credentials.realm}/protocol/openid-connect/token`, this.accessServiceUrl).href,
        qs.stringify({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        }
      );

      // Update the user session data with new tokens and associated expiry information.
      const now = Date.now() / 1000;
      req.session['passport'].user.accessToken = data.access_token;
      req.session['passport'].user.refreshToken = data.refresh_token;
      // Expiry values could be decoded from the token instead, but that's extra work.
      req.session['passport'].user.exp = now + data.expires_in;
      req.session['passport'].user.refreshExp = now + data.refresh_expires_in;

      this.logger.info(
        `Refreshed token for user (ID: ${req.user.id}) on session (ID: ${req.sessionID}) with new expiry in ${data.refresh_expires_in} seconds.`,
        {
          context: 'ClientRegistrationEntity',
          tenant: this.tenantId.toString(),
        }
      );

      return data.access_token;
    } catch (err) {
      this.logger.warn(
        `Error encountered refreshing token for user (ID: ${req.user?.id}) on session (ID: ${req.sessionID}). Terminating session.`,
        {
          context: 'ClientRegistrationEntity',
          tenant: this.tenantId.toString(),
        }
      );

      req.logout((err) => {
        if (!err) {
          this.logger.info(`Ended session for user (ID: ${req.user?.id}).`, {
            context: 'ClientRegistrationEntity',
            tenant: this.tenantId.toString(),
          });
        } else {
          this.logger.warn(`Error encountered ending session for user (ID: ${req.user?.id}): ${err}`, {
            context: 'ClientRegistrationEntity',
            tenant: this.tenantId.toString(),
          });
        }
      });

      throw err;
    }
  }
}
