import z from 'zod';
import type { KeycloakRepresentation } from './adminRead';
import type { RealmClientResult } from './realmClient';
import { asRecord, optionalBoolean, optionalString, recordList, stringList } from './values';

/**
 * Plain-language view of why a user can or cannot sign in. Read from an explicit allowlist: IP addresses, the
 * usernames typed at failed sign-ins, credential values and other personal details are never copied.
 */

export const MAX_SIGN_IN_SESSIONS = 10;
export const MAX_SIGN_IN_ERRORS = 10;
export const SCANNED_USER_EVENTS = 50;

export const REQUIRED_ACTION_MEANINGS: Readonly<Record<string, string>> = {
  VERIFY_EMAIL: 'Must confirm their email address from the link Keycloak sends.',
  UPDATE_PASSWORD: 'Must set a new password at their next sign-in.',
  CONFIGURE_TOTP: 'Must set up an authenticator app for one-time codes at their next sign-in.',
  UPDATE_PROFILE: 'Must complete their profile at their next sign-in.',
  VERIFY_PROFILE: 'Must review and confirm their profile at their next sign-in.',
  UPDATE_EMAIL: 'Must update their email address at their next sign-in.',
  TERMS_AND_CONDITIONS: 'Must accept the terms and conditions at their next sign-in.',
  'webauthn-register': 'Must register a security key at their next sign-in.',
  'webauthn-register-passwordless': 'Must register a passwordless security key at their next sign-in.',
  update_user_locale: 'Must choose a language at their next sign-in.',
  delete_credential: 'Was asked to remove one of their sign-in methods.',
  delete_account: 'Is allowed to delete their own account.',
};

export const SIGN_IN_ERROR_MEANINGS: Readonly<Record<string, string>> = {
  user_not_found: 'The username or email entered does not exist in this realm.',
  invalid_user_credentials: 'The password was wrong.',
  user_disabled: 'The account is turned off.',
  user_temporarily_disabled: 'The account was locked after too many failed sign-ins.',
  invalid_redirect_uri: 'The app sent a return address (redirect URI) that its client does not allow.',
  invalid_client: 'The app used a client that does not exist or is turned off.',
  invalid_client_credentials: 'The app sent the wrong client secret.',
  unauthorized_client: 'The client is not allowed to use this kind of sign-in.',
  expired_code: 'The sign-in page was open too long or was reused. Starting the sign-in again usually fixes it.',
  invalid_code: 'The app reused a sign-in code that was already used or had expired.',
  invalid_grant: 'The app sent a sign-in code or refresh token that was expired or already used.',
  cookie_not_found:
    "The browser did not send Keycloak's cookies, often because of a private window or blocked cookies.",
  identity_provider_error: 'The external sign-in provider, such as GoA sign-in, returned an error.',
  identity_provider_login_failure: 'Signing in through the external sign-in provider failed.',
  federated_identity_account_exists:
    'An account with the same username or email already exists and is not linked to this sign-in provider.',
  invalid_user: 'The account could not be used for this sign-in.',
  not_allowed: "The sign-in was refused by the realm's sign-in rules.",
  user_session_not_found: 'The sign-in session had ended. Signing in again usually fixes it.',
  session_expired: 'The session had expired.',
  invalid_token: 'The app sent a token that has expired or is not valid.',
  invalid_request: 'The app sent a sign-in request Keycloak could not understand.',
  consent_denied: 'The user declined the consent screen.',
  rejected_by_user: 'The user cancelled the sign-in.',
  access_denied: 'Access was denied.',
};

const EVENT_TYPE_LABELS: Readonly<Record<string, string>> = {
  LOGIN_ERROR: 'Sign-in',
  CODE_TO_TOKEN_ERROR: 'Getting a token after sign-in',
  REFRESH_TOKEN_ERROR: 'Refreshing a token',
  IDENTITY_PROVIDER_LOGIN_ERROR: 'Sign-in through an external provider',
  IDENTITY_PROVIDER_FIRST_LOGIN_ERROR: 'First sign-in through an external provider',
  IDENTITY_PROVIDER_POST_LOGIN_ERROR: 'After sign-in through an external provider',
  LOGOUT_ERROR: 'Sign-out',
  CLIENT_LOGIN_ERROR: 'Service account sign-in',
  UPDATE_PASSWORD_ERROR: 'Updating the password',
  VERIFY_EMAIL_ERROR: 'Verifying the email',
  RESET_PASSWORD_ERROR: 'Resetting the password',
};

const NOTES = {
  lockout: 'Whether the account is locked could not be read.',
  realm: "Whether your realm's lockout protection is on could not be read; reading it needs the view-realm role.",
  credentials: 'Which sign-in methods the user has set up could not be read.',
  sessions: 'Active sessions could not be read.',
  events: 'Sign-in history could not be read; reading it needs the realm-management view-events role.',
};

const signInErrorSchema = z.object({
  time: z.string().optional(),
  step: z.string(),
  error: z.string(),
  meaning: z.string().optional(),
  app: z.string().optional(),
});

export const accessSignInStatusSchema = z.object({
  enabled: z.boolean().optional(),
  lockout: z
    .object({
      protectionOn: z.boolean().optional(),
      permanent: z.boolean().optional(),
      lockedOut: z.boolean().optional(),
      failedAttempts: z.number().optional(),
      lastFailureAt: z.string().optional(),
      lockedUntil: z.string().optional(),
    })
    .optional(),
  requiredActions: z.array(z.object({ action: z.string(), meaning: z.string() })),
  signInMethods: z.object({
    identityProviders: z.array(z.string()),
    password: z.boolean().optional(),
    otp: z.boolean().optional(),
    securityKey: z.boolean().optional(),
  }),
  sessions: z
    .array(z.object({ started: z.string().optional(), lastActive: z.string().optional(), apps: z.array(z.string()) }))
    .optional(),
  history: z
    .object({
      recording: z.boolean().optional(),
      lastSignInAt: z.string().optional(),
      recentErrors: z.array(signInErrorSchema),
    })
    .optional(),
  notes: z.array(z.string()),
});

export type AccessSignInStatus = z.infer<typeof accessSignInStatusSchema>;

export interface SignInReads {
  user: KeycloakRepresentation;
  lockout: RealmClientResult<KeycloakRepresentation>;
  realm: RealmClientResult<KeycloakRepresentation>;
  credentials: RealmClientResult<KeycloakRepresentation[]>;
  sessions: RealmClientResult<KeycloakRepresentation[]>;
  eventsConfig: RealmClientResult<KeycloakRepresentation>;
  events: RealmClientResult<KeycloakRepresentation[]>;
}

/**
 * Converts a Keycloak timestamp in milliseconds to an ISO date, leaving out zero and missing values.
 */
export function toIsoTime(milliseconds: unknown): string | undefined {
  return typeof milliseconds === 'number' && Number.isFinite(milliseconds) && milliseconds > 0
    ? new Date(milliseconds).toISOString()
    : undefined;
}

function toLockout(
  lockout: SignInReads['lockout'],
  realm: SignInReads['realm'],
  now: number,
): AccessSignInStatus['lockout'] {
  if (lockout.ok === false) {
    return undefined;
  }

  const status = lockout.value;
  const settings = realm.ok === true ? realm.value : {};
  // Keycloak reports the end of a temporary lockout in seconds and the last failure in milliseconds.
  const notBeforeSeconds = typeof status.failedLoginNotBefore === 'number' ? status.failedLoginNotBefore : 0;
  const failedAttempts = typeof status.numFailures === 'number' ? status.numFailures : undefined;

  return {
    protectionOn: optionalBoolean(settings.bruteForceProtected),
    permanent: optionalBoolean(settings.permanentLockout),
    lockedOut: optionalBoolean(status.disabled),
    failedAttempts,
    lastFailureAt: toIsoTime(status.lastFailure),
    lockedUntil: notBeforeSeconds * 1000 > now ? toIsoTime(notBeforeSeconds * 1000) : undefined,
  };
}

function toSignInMethods(
  user: KeycloakRepresentation,
  credentials: SignInReads['credentials'],
): AccessSignInStatus['signInMethods'] {
  const identityProviders = recordList(user.federatedIdentities)
    .map((identity) => optionalString(identity.identityProvider))
    .filter((alias): alias is string => !!alias)
    .sort();
  if (credentials.ok === false) {
    return { identityProviders };
  }

  // Only each credential's type is read; its value, label and dates are not.
  const types = new Set(credentials.value.map((credential) => optionalString(credential.type)));
  return {
    identityProviders,
    password: types.has('password'),
    otp: types.has('otp') || user.totp === true,
    securityKey: types.has('webauthn') || types.has('webauthn-passwordless'),
  };
}

function toSessions(sessions: SignInReads['sessions']): AccessSignInStatus['sessions'] {
  if (sessions.ok === false) {
    return undefined;
  }

  return sessions.value
    .map((session) => ({
      started: toIsoTime(session.start),
      lastActive: toIsoTime(session.lastAccess),
      apps: Object.values(asRecord(session.clients))
        .map(optionalString)
        .filter((clientId): clientId is string => !!clientId)
        .sort(),
    }))
    .sort((left, right) => (right.lastActive ?? '').localeCompare(left.lastActive ?? ''))
    .slice(0, MAX_SIGN_IN_SESSIONS);
}

function toHistory(
  eventsConfig: SignInReads['eventsConfig'],
  events: SignInReads['events'],
): AccessSignInStatus['history'] {
  if (events.ok === false) {
    return undefined;
  }

  const recording = eventsConfig.ok === true ? optionalBoolean(eventsConfig.value.eventsEnabled) : undefined;
  const recentErrors = events.value
    .filter((event) => optionalString(event.type)?.endsWith('_ERROR'))
    .slice(0, MAX_SIGN_IN_ERRORS)
    .map((event) => {
      const type = optionalString(event.type);
      const error = optionalString(event.error) ?? 'unknown';
      return {
        time: toIsoTime(event.time),
        step:
          EVENT_TYPE_LABELS[type] ??
          type
            .replace(/_ERROR$/, '')
            .replace(/_/g, ' ')
            .toLowerCase(),
        error,
        meaning: SIGN_IN_ERROR_MEANINGS[error],
        app: optionalString(event.clientId),
      };
    });
  const lastSignIn = events.value.find((event) => event.type === 'LOGIN');

  return { recording, lastSignInAt: toIsoTime(lastSignIn?.time), recentErrors };
}

/**
 * Builds the sign-in status of a user from the reads that succeeded, noting in plain words each part that could not
 * be read instead of failing the whole check.
 */
export function toSignInStatus(reads: SignInReads, now = Date.now()): AccessSignInStatus {
  const { user, lockout, realm, credentials, sessions, eventsConfig, events } = reads;
  const notes = [
    lockout.ok === false && NOTES.lockout,
    lockout.ok === true && realm.ok === false && NOTES.realm,
    credentials.ok === false && NOTES.credentials,
    sessions.ok === false && NOTES.sessions,
    events.ok === false && NOTES.events,
  ].filter((note): note is string => !!note);

  return {
    enabled: optionalBoolean(user.enabled),
    lockout: toLockout(lockout, realm, now),
    requiredActions: [...stringList(user.requiredActions)].sort().map((action) => ({
      action,
      meaning: REQUIRED_ACTION_MEANINGS[action] ?? 'Must complete this step at their next sign-in.',
    })),
    signInMethods: toSignInMethods(user, credentials),
    sessions: toSessions(sessions),
    history: toHistory(eventsConfig, events),
    notes,
  };
}

/**
 * Summarizes in one plain sentence the most likely reason a user cannot sign in, or that nothing blocks them.
 */
export function describeSignInBlocker(status: AccessSignInStatus): string {
  if (status.enabled === false) {
    return 'The account is turned off, so the user cannot sign in until an administrator turns it back on.';
  }
  if (status.lockout?.lockedOut) {
    return status.lockout.lockedUntil
      ? `The account is locked after too many failed sign-ins until ${status.lockout.lockedUntil}.`
      : 'The account is locked after too many failed sign-ins until an administrator unlocks it.';
  }
  if (status.requiredActions.length > 0) {
    return 'The account is active, but the user must complete a required step at their next sign-in.';
  }
  return 'Nothing on the account blocks sign-in: it is turned on, not locked, and has no pending steps.';
}
