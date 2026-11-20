import { describeCallerKeycloakFix, describeKeycloakFix } from './keycloakSteps';

export type MatchLevel = 'exact' | 'strong' | 'weak';

export interface FollowUp {
  tool: string;
  arguments: Record<string, unknown>;
  why: string;
  needsSignIn: boolean;
}

export interface Cause {
  cause: string;
  fix: string;
}

export interface Diagnosis {
  id: string;
  match: MatchLevel;
  symptom: string;
  causes: Cause[];
  check: string;
  followUp?: FollowUp[];
  sources: string[];
}

export interface SymptomSignals {
  text: string;
  statusCodes: number[];
  target?: { urn: string; app?: string };
  outboundContext: boolean;
  ownEndpoint: boolean;
}

export interface DiagnosisRule {
  id: string;
  symptom: string;
  messageFragments: string[];
  statusCodes: number[];
  keywords: string[];
  /** Words too common to count on their own: they add to the score only next to one of `keywords`. */
  genericKeywords?: string[];
  /** The status code counts only next to one of `keywords`, e.g. a 401 that came from the token endpoint. */
  statusNeedsKeyword?: boolean;
  sources: string[];
  build(signals: SymptomSignals): Omit<Diagnosis, 'id' | 'match' | 'symptom' | 'sources'>;
}

const ROLES_FOLLOW_UP: FollowUp = {
  tool: 'list_service_roles',
  arguments: {},
  why: 'Find the least-privileged role to assign in step 2.',
  needsSignIn: true,
};

const DIRECTION_CHECK =
  'Which side are you on? If your service received this when it called another service, your service is the ' +
  'caller: make the changes on your own Keycloak client. If your own endpoint returned it to a caller, the ' +
  "caller's client needs your service's URN and your service's role instead.";

const TOKEN_CHECK =
  "Decode the calling service's access token: the target service's URN must be in `aud`, and the role under " +
  '`resource_access["<target URN>"]`. Whichever is missing is the change you still need, but both are required.';

function keycloakFix({ ownEndpoint, target }: SymptomSignals): string {
  if (ownEndpoint) {
    return [
      "Your endpoint returned this to a caller, so the changes go on the caller's Keycloak client, aimed at your service.",
      ...describeCallerKeycloakFix(),
    ].join(' ');
  }
  return describeKeycloakFix(target?.urn).join(' ');
}

const REGISTRATION_ERROR = 'Error encountered during service registration';

// When the registration error itself is in the symptom, "it failed" is the likelier cause than "it never ran".
function orderRegistrationCauses(text: string) {
  const neverRegistered = {
    cause:
      "The configuration schema was never registered: `configuration` isn't passed in the `initializeService` options.",
    fix: 'Pass `configuration` (with its `configurationSchema`) in the `initializeService` options, so the SDK registers it at startup.',
  };
  const registrationFailed = {
    cause: `Registration ran at startup but failed. The SDK logs "${REGISTRATION_ERROR}" followed by the reason.`,
    fix:
      'Read the error after that message. A 401 or 403 there usually means your service account lacks ' +
      '`configured-service` on `urn:ads:platform:configuration-service`, which registration needs.',
  };
  return text.toLowerCase().includes(REGISTRATION_ERROR.toLowerCase())
    ? [registrationFailed, neverRegistered]
    : [neverRegistered, registrationFailed];
}

const BOTH_CHANGES = 'Make both changes above: this cause is fixed by the same two steps, never by one of them alone.';

export const DIAGNOSIS_RULES: DiagnosisRule[] = [
  {
    id: 'service-call-401',
    symptom: '401 Unauthorized on a call between services',
    messageFragments: [],
    statusCodes: [401],
    keywords: ['audience', 'aud claim', 'audience mapper'],
    sources: ['important-notes.md'],
    build: (signals) => ({
      causes: [
        {
          cause: "The calling service's token doesn't carry the target service's URN in its `aud` (audience) claim.",
          fix: keycloakFix(signals),
        },
        {
          cause: "The calling service's account doesn't have the role the target service requires.",
          fix: BOTH_CHANGES,
        },
      ],
      check: `${TOKEN_CHECK} ${DIRECTION_CHECK}`,
      followUp: [ROLES_FOLLOW_UP],
    }),
  },
  {
    id: 'service-call-403',
    symptom: '403 Forbidden, or "User … not permitted to …", on a call between services',
    messageFragments: ['not permitted to'],
    statusCodes: [403],
    keywords: ['access denied', 'not permitted'],
    sources: ['important-notes.md'],
    build: (signals) => ({
      causes: [
        {
          cause:
            'The caller\'s account doesn\'t have the role the operation needs. In a "User … not permitted to …" ' +
            'message, the user named is the account that was refused.',
          fix: keycloakFix(signals),
        },
        {
          cause: "The caller's token doesn't carry the target service's URN in `aud`.",
          fix: BOTH_CHANGES,
        },
      ],
      check: `${TOKEN_CHECK} ${DIRECTION_CHECK}`,
      followUp: [ROLES_FOLLOW_UP],
    }),
  },
  {
    id: 'configuration-undefined',
    symptom: '`req.getConfiguration()` returns undefined or empty',
    messageFragments: [
      'Error encountered during service registration',
      'Error encountered in request for configuration of',
      'received no value',
    ],
    statusCodes: [],
    keywords: ['getconfiguration', 'configuration', 'configurationschema', 'registration', 'registered'],
    genericKeywords: ['undefined', 'empty', 'null'],
    sources: ['platform/platform-node-sdk.md'],
    build: ({ target, text }) => ({
      causes: [
        ...orderRegistrationCauses(text),
        {
          cause:
            "Your service's account can't read configuration. The SDK logs \"Error encountered in request for " +
            'configuration of …".',
          fix:
            "Assign the `configured-service` role on `urn:ads:platform:configuration-service` to your service's " +
            'service account.',
        },
        {
          cause: 'No value has been saved yet for this tenant. The SDK logs "…received no value".',
          fix: 'Save a configuration value for the tenant, or handle the empty case in your code.',
        },
        {
          cause:
            'With `initializePlatform`, the request has no tenant, so there is no tenant configuration to read. ' +
            "(With `initializeService`, `req.getConfiguration()` always reads your service's own tenant.)",
          fix: 'Make sure `req.tenant` is set: mount `tenantHandler` after `passport.authenticate`.',
        },
      ],
      check:
        'Look in your service log for the three SDK lines above: the one that appears tells you which cause applies.',
      followUp: [
        {
          tool: 'get_service_configuration_schema',
          arguments: target ? { serviceId: target.urn } : {},
          why: 'See the configuration shape a platform service accepts from yours (for `serviceConfigurations`).',
          needsSignIn: true,
        },
      ],
    }),
  },
  {
    id: 'tenant-not-resolved',
    symptom: '`req.tenant` is undefined: the tenant was not resolved for a request',
    messageFragments: ['Cannot find tenant associated with iss'],
    statusCodes: [],
    keywords: ['req.tenant', 'tenancy', 'tenanthandler', 'tenantid', 'not resolved'],
    genericKeywords: ['tenant', 'undefined', 'iss'],
    sources: ['platform/platform-node-sdk.md'],
    build: () => ({
      causes: [
        {
          cause:
            'Your service uses `initializeService`, which never sets `req.tenant`: the tenant handler is only part ' +
            'of `initializePlatform`.',
          fix:
            "Use `req.user.tenantId` for the caller's tenant. `req.getConfiguration()` already reads your service's " +
            'own tenant.',
        },
        {
          cause:
            "With `initializePlatform`, `tenantHandler` runs before `passport.authenticate`, or isn't mounted, so it " +
            'never sees a user.',
          fix: 'Mount `tenantHandler` after `passport.authenticate(...)` on the routes that need a tenant.',
        },
        {
          cause:
            'The token was issued by a realm that isn\'t an ADSP tenant. The SDK reports "Cannot find tenant ' +
            'associated with iss".',
          fix: "Use a token issued by the tenant's own realm.",
        },
        {
          cause: "With `initializePlatform`, the caller is a core service account and didn't say which tenant.",
          fix: 'Pass `?tenantId=<tenant URN>`. The handler reads it only for core users.',
        },
      ],
      check:
        "Decode the token and compare `iss` with the tenant's realm (`<access service URL>/auth/realms/<realm>`). " +
        'The SDK leaves `req.tenant` unset, with no error, when tenancy cannot be resolved.',
    }),
  },
  {
    id: 'directory-lookup-failed',
    symptom: 'A directory lookup fails: "Failed to find directory entry for urn:…"',
    messageFragments: [
      'Failed to find directory entry for',
      'Provided ID is not for a Service or API',
      'Error encountered retrieving directory',
    ],
    statusCodes: [],
    keywords: ['directory', 'getserviceurl', 'service url', 'directory entry'],
    genericKeywords: ['lookup', 'urn', 'not found'],
    sources: ['platform/platform-node-sdk.md', 'services/directory-service.md'],
    build: () => ({
      causes: [
        {
          cause:
            'The URN is wrong or misspelled, or names a resource rather than a service or API. For a resource URN ' +
            'the SDK says "Provided ID is not for a Service or API."',
          fix: 'Use the service or API URN, for example `urn:ads:platform:event-service` or `urn:ads:platform:event-service:v1`.',
        },
        {
          cause: "The service or API isn't registered in this environment's directory.",
          fix: 'Check that the service exists in the environment you are running against.',
        },
        {
          cause:
            'The directory URL points at the wrong environment. The SDK logs "Error encountered retrieving directory".',
          fix: 'Check `directoryUrl` in the `initializeService` options.',
        },
      ],
      check: 'The SDK names the URN it looked for: compare it with the list of service URNs.',
      followUp: [
        {
          tool: 'list_service_apis',
          arguments: {},
          why: 'List the services and their URNs, to compare with the one that failed.',
          needsSignIn: false,
        },
      ],
    }),
  },
  {
    id: 'token-request-failed',
    symptom: "The SDK can't get its own access token",
    messageFragments: ['Error encountered retrieving access token'],
    statusCodes: [401],
    statusNeedsKeyword: true,
    keywords: [
      'access token',
      'client secret',
      'clientsecret',
      'client credentials',
      'invalid_client',
      'unauthorized_client',
      'token endpoint',
      'keycloak',
      'getting token',
      'getting a token',
      'get a token',
    ],
    genericKeywords: ['token', 'service account'],
    sources: ['platform/platform-node-sdk.md', 'getting-started.md'],
    build: () => ({
      causes: [
        {
          cause: "A wrong client ID, client secret or realm in the SDK's options.",
          fix: "Check `serviceId`, `clientSecret` and `realm` against the service's Keycloak client.",
        },
        {
          cause: "Service accounts aren't turned on for the client.",
          fix: 'In Keycloak, turn on Service accounts for the client.',
        },
        {
          cause:
            'The service account lacks the `platform-service` role on `urn:ads:platform:tenant-service`, which the SDK ' +
            'requires.',
          fix: "Assign it under the client's Service Account Roles → Client Roles.",
        },
      ],
      check:
        "The token endpoint's error code tells you which: `invalid_client` is a wrong ID or secret, and " +
        '`unauthorized_client` means service accounts are off.',
    }),
  },
];
