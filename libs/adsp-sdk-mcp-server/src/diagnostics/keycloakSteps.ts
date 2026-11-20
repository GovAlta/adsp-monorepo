export interface KeycloakStep {
  title: string;
  why: string;
  consolePath: string;
}

export const AUDIENCE_MAPPER_STEP: KeycloakStep = {
  title: 'Add an audience mapper',
  why:
    'Every ADSP service validates that its own URN appears in the `aud` (audience) claim of the incoming token.\n' +
    "Your service's token will not carry that URN by default, so every call will be rejected with 401 unless you\n" +
    'add an audience mapper.',
  consolePath:
    'Clients → {your-client-id} → Client Scopes → {your-client-id}-dedicated →\n' +
    'Add mapper → By configuration → Audience',
};

export const SERVICE_ACCOUNT_ROLE_STEP: KeycloakStep = {
  title: 'Assign the service account role',
  why:
    "Your service's token must also carry the role the target service requires for the operation. Use\n" +
    '`list_service_roles` to find the least-privileged role, then assign it.',
  consolePath: 'Clients → {your-client-id} → Service Account Roles → Client Roles',
};

export const BOTH_STEPS_REQUIRED =
  'Both steps are always required. The audience mapper makes your token acceptable to the target service; the\n' +
  'role controls what that service will permit your service account to do.';

const EXAMPLE_TARGET = "the target service's URN (for example `urn:ads:platform:file-service`)";

export function renderQuickstartKeycloakSection(): string {
  return [
    '## 4. Keycloak setup for service-to-service calls',
    'When your service makes HTTP requests to another ADSP service (e.g. uploads files via file-service, sends\n' +
      "notifications via notification-service), **two Keycloak changes are required on your service's client** — one\n" +
      'is NOT enough:',
    `### Step 1 — ${AUDIENCE_MAPPER_STEP.title}`,
    AUDIENCE_MAPPER_STEP.why,
    `In Keycloak admin console: **${AUDIENCE_MAPPER_STEP.consolePath}** → set "Included Client Audience" to the target service's URN\n` +
      '(e.g. `urn:ads:platform:file-service`). Repeat for each service you call.',
    `### Step 2 — ${SERVICE_ACCOUNT_ROLE_STEP.title}`,
    SERVICE_ACCOUNT_ROLE_STEP.why,
    `In Keycloak admin console: **${SERVICE_ACCOUNT_ROLE_STEP.consolePath}** → select\n` +
      "the target service's URN from the dropdown → assign the role (e.g. `file-service-user`). Repeat for each\n" +
      'service you call.',
    BOTH_STEPS_REQUIRED,
  ].join('\n\n');
}

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ');

/** The two steps as a diagnosis states them, naming the target service when it is known. */
export function describeKeycloakFix(targetUrn?: string): string[] {
  const target = targetUrn ? `\`${targetUrn}\`` : EXAMPLE_TARGET;
  return [
    `Step 1 — ${AUDIENCE_MAPPER_STEP.title}. ${oneLine(AUDIENCE_MAPPER_STEP.why)} In Keycloak admin console: ` +
      `**${oneLine(AUDIENCE_MAPPER_STEP.consolePath)}** → set "Included Client Audience" to ${target}.`,
    `Step 2 — ${SERVICE_ACCOUNT_ROLE_STEP.title}. ${oneLine(SERVICE_ACCOUNT_ROLE_STEP.why)} In Keycloak admin ` +
      `console: **${SERVICE_ACCOUNT_ROLE_STEP.consolePath}** → select ${targetUrn ? target : "the target service's URN"} ` +
      'from the dropdown → assign that role.',
    oneLine(BOTH_STEPS_REQUIRED),
  ];
}

const onCallerClient = (consolePath: string) =>
  oneLine(consolePath).replace(/\{your-client-id\}/g, '{caller-client-id}');

/** The same two steps when your own endpoint rejected a caller: they go on the caller's client, aimed at you. */
export function describeCallerKeycloakFix(): string[] {
  return [
    `Step 1 — ${AUDIENCE_MAPPER_STEP.title}. The caller's token must carry your service's URN in \`aud\`, or your ` +
      `endpoint rejects it with 401. In Keycloak admin console: **${onCallerClient(AUDIENCE_MAPPER_STEP.consolePath)}** ` +
      `→ set "Included Client Audience" to your service's URN.`,
    `Step 2 — ${SERVICE_ACCOUNT_ROLE_STEP.title}. The caller's token must also carry the role your endpoint checks. ` +
      `In Keycloak admin console: **${onCallerClient(SERVICE_ACCOUNT_ROLE_STEP.consolePath)}** → select your ` +
      "service's URN from the dropdown → assign that role.",
    oneLine(BOTH_STEPS_REQUIRED),
  ];
}
