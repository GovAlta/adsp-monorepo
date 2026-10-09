import { AdspId, LimitToOne, ServiceDirectory, Tenant } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import axios, { isAxiosError } from 'axios';
import { Request, RequestHandler } from 'express';
import jwtDecode from 'jwt-decode';
import { AuthenticateOptions, PassportStatic, Strategy } from 'passport';
import { AuthenticateOptions as OidcAuthenticateOptions, Strategy as OidcStrategy } from 'passport-openidconnect';
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

interface OidcClientUpdateResponse {
  client_id: string;
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
  authCallbackUrl?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  targets: Record<string, TargetProxy>;
  credentials?: ClientCredentials;
  private strategy: Strategy;

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
    this.successRedirectUrl = client.successRedirectUrl || '/';
    this.failureRedirectUrl = client.failureRedirectUrl || '/';
    this.targets = Object.entries(client.targets).reduce(
      (targets, [targetId, target]) => ({ ...targets, [targetId]: new TargetProxy(logger, this, directory, target) }),
      {}
    );
  }

  public async register(tenant: Tenant, registrationToken: string, authCallbackUrl?: string) {
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
          redirect_uris: authCallbackUrl ? [authCallbackUrl] : [],
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
      // The strategy is configured with the credentials, so it needs to be recreated.
      this.strategy = undefined;

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

  public async updateRegistration(redirectUris: string[]) {
    this.logger.debug(`Updating registration for client ${this.id}...`, {
      context: 'ClientRegistrationEntity',
      tenant: this.tenantId.toString(),
    });

    const credentials = await this.getCredentials();
    if (!credentials) {
      throw new InvalidOperationError('Client not registered.');
    }

    try {
      const { data } = await axios.put<OidcClientUpdateResponse>(
        credentials.registrationUrl,
        {
          client_id: credentials.clientId,
          client_name: this.id,
          token_endpoint_auth_method: 'client_secret_basic',
          grant_types: ['authorization_code', 'refresh_token'],
          redirect_uris: redirectUris,
        },
        { headers: { Authorization: `Bearer ${credentials.registrationToken}` } }
      );

      const updated = {
        ...credentials,
        registrationToken: data.registration_access_token,
      };

      this.credentials = await this.repository.save(this, updated);

      this.logger.info(`Updated registration for client ${this.id}.`, {
        context: 'ClientRegistrationEntity',
        tenant: this.tenantId.toString(),
      });

      return this.credentials;
    } catch (err) {
      if (isAxiosError(err) && err.response.status === 401) {
        throw new InvalidOperationError('Update request failed. Registration token may be expired.');
      } else {
        throw err;
      }
    }
  }

  public async getCredentials(): Promise<ClientCredentials> {
    // Lazy load credentials from repository.
    // Note: This object is cached as configuration and update of credentials is handled via cache invalidation.
    if (!this.credentials) {
      const loaded = await this.repository.get(this);
      // Credentials saved by a registration while loading are newer than the loaded credentials.
      this.credentials = this.credentials ?? loaded;
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
    if (!this.strategy) {
      const credentials = await this.getCredentials();
      if (!credentials) {
        throw new InvalidOperationError('Cannot use client to authenticate before registration.');
      }

      const strategy = new OidcStrategy(
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
          // The callback URL is specific to the request and is provided on each authenticate call.
          callbackURL: '',
          prompt: this.prompt,
          scope: this.scope,
        },
        this.verify
      );

      // Only cache the strategy if the credentials were not replaced by a registration while it was created.
      if (this.credentials !== credentials) {
        return strategy;
      }
      this.strategy = strategy;
    }

    return this.strategy;
  }

  public async authenticate(passport: PassportStatic, complete = false): Promise<RequestHandler> {
    this.logger.debug(`${complete ? 'Complete' : 'Initiate'} authentication request on client ${this.id}...`, {
      context: 'AuthenticationClient',
      tenant: this.tenantId?.toString(),
    });

    return async (req, res, next) => {
      try {
        let callbackURL: string;
        if (!complete) {
          const queryCallbackUrl = req.query.callbackUrl as string;
          if (queryCallbackUrl) {
            callbackURL = queryCallbackUrl;
          } else if (this.authCallbackUrl) {
            const { pathname } = new URL(this.authCallbackUrl);
            callbackURL = `${req.protocol}://${req.get('host')}${pathname}`;
          } else {
            throw new InvalidOperationError('callbackUrl query parameter or authCallbackUrl config is required.');
          }
          req.session['callbackUrl'] = callbackURL;
        } else {
          callbackURL = req.session['callbackUrl'] as string;
          if (!callbackURL) {
            throw new InvalidOperationError('No callback URL in session.');
          }
        }

        const strategy = await this.getStrategy();
        // The callback URL is provided per request, so the same strategy can be used for different callback URLs.
        const options: AuthenticateOptions & OidcAuthenticateOptions = {
          callbackURL,
          failureRedirect: this.failureRedirectUrl,
        };
        const authenticateHandler = passport.authenticate(strategy, options);

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
                      this.logger.warn(
                        `Error encountered ending session for user (ID: ${req.user?.id}): ${logoutErr}`,
                        {
                          context: 'ClientRegistrationEntity',
                          tenant: this.tenantId.toString(),
                        }
                      );
                    }
                    next(err);
                  });
                }
              }
            : next
        );
      } catch (err) {
        next(err);
      }
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
