// Configures a tenant for the sandbox planning poker POC: event definitions, push stream, and Lua scripts.
//
// Dry run (prints the configuration patches):
//   node apps/sandbox-app/docs/planning-poker/configure-tenant.mjs
//
// Apply (token must belong to a tenant admin of the target tenant):
//   CONFIGURATION_SERVICE_URL=https://configuration-service.adsp-uat.alberta.ca \
//   ADSP_TOKEN=<access token> \
//   node apps/sandbox-app/docs/planning-poker/configure-tenant.mjs --apply
//
// Any user of the tenant can play: scripts and the stream accept the realm's default role, which Keycloak
// gives every user. The realm is read from the token issuer, or from TENANT_REALM for a dry run.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NAMESPACE = 'planning-poker';
const STREAM_ID = 'planning-poker-updates';

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), 'scripts');

const stringProperties = (...names) => Object.fromEntries(names.map((name) => [name, { type: 'string' }]));

const EVENTS = {
  'participant-joined': {
    description: 'Signalled when a participant joins a planning poker session, and on each heartbeat.',
    properties: stringProperties('sessionId', 'userId', 'userName'),
  },
  'participant-left': {
    description: 'Signalled when a participant leaves a planning poker session.',
    properties: stringProperties('sessionId', 'userId'),
  },
  'round-started': {
    description: 'Signalled when a new estimation round is started.',
    properties: stringProperties(
      'sessionId',
      'roundId',
      'storyTitle',
      'storyUrl',
      'status',
      'startedById',
      'startedByName',
    ),
  },
  'vote-cast': {
    description: 'Signalled when a participant votes. The vote value is not included.',
    properties: stringProperties('sessionId', 'roundId', 'userId', 'userName'),
  },
  'votes-revealed': {
    description: 'Signalled when the votes of a round are revealed.',
    properties: {
      ...stringProperties('sessionId', 'roundId', 'storyTitle', 'storyUrl', 'status'),
      average: { type: 'number' },
      hasAverage: { type: 'boolean' },
      consensus: { type: 'boolean' },
      votes: { type: 'object' },
    },
  },
};

const SCRIPTS = [
  {
    id: 'poker-start-round',
    name: 'Planning poker start round',
    description: 'Starts a new estimation round in a planning poker session.',
  },
  {
    id: 'poker-join',
    name: 'Planning poker join',
    description: 'Records a participant joining a planning poker session; also used as a heartbeat.',
  },
  {
    id: 'poker-leave',
    name: 'Planning poker leave',
    description: 'Records a participant leaving a planning poker session.',
  },
  {
    id: 'poker-cast-vote',
    name: 'Planning poker cast vote',
    description: 'Casts or changes a vote in the current round without revealing it.',
  },
  {
    id: 'poker-get-state',
    name: 'Planning poker get state',
    description: 'Returns the session state; vote values only after reveal.',
  },
  {
    id: 'poker-reveal',
    name: 'Planning poker reveal',
    description: 'Reveals all votes in the current round and closes it.',
  },
];

function buildEventServicePatch() {
  const definitions = Object.fromEntries(
    Object.entries(EVENTS).map(([name, { description, properties }]) => [
      name,
      { name, description, payloadSchema: { type: 'object', properties } },
    ]),
  );
  return { operation: 'UPDATE', update: { [NAMESPACE]: { name: NAMESPACE, definitions } } };
}

function buildPushServicePatch(tenantRole) {
  return {
    operation: 'UPDATE',
    update: {
      [STREAM_ID]: {
        id: STREAM_ID,
        name: 'Planning poker updates',
        description: 'Live updates for planning poker sessions. Subscribers filter by context.sessionId.',
        publicSubscribe: false,
        subscriberRoles: [tenantRole],
        events: Object.keys(EVENTS).map((name) => ({ namespace: NAMESPACE, name })),
      },
    },
  };
}

function buildScriptServicePatch(tenantRole) {
  const definitions = Object.fromEntries(
    SCRIPTS.map((script) => [
      script.id,
      {
        ...script,
        script: readFileSync(join(scriptsDir, `${script.id}.lua`), 'utf8'),
        runnerRoles: [tenantRole],
        // Scripts must run as the script service so players never need value service roles.
        useServiceAccount: true,
        // Keeping inputs out of the script-executed event stops vote values leaking before reveal.
        includeValuesInEvent: false,
        triggerEvents: [],
      },
    ]),
  );
  return { operation: 'UPDATE', update: definitions };
}

function buildPatches(tenantRole) {
  return {
    'event-service': buildEventServicePatch(),
    'push-service': buildPushServicePatch(tenantRole),
    'script-service': buildScriptServicePatch(tenantRole),
  };
}

// Tenant tokens are issued by <keycloak>/auth/realms/<realm>.
function readRealmFromToken(token) {
  const [, payload] = token.split('.');
  const { iss } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return iss.split('/realms/')[1];
}

async function applyPatch(configurationUrl, token, service, patch) {
  const response = await fetch(new URL(`/configuration/v2/configuration/platform/${service}`, configurationUrl), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Patch of platform:${service} failed with ${response.status}: ${await response.text()}`);
  }
  console.log(`Updated platform:${service}`);
}

async function main() {
  const { CONFIGURATION_SERVICE_URL: configurationUrl, ADSP_TOKEN: token, TENANT_REALM: realmValue } = process.env;
  const realm = realmValue || (token ? readRealmFromToken(token) : '<realm>');
  const patches = buildPatches(`default-roles-${realm}`);

  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify(patches, null, 2));
    console.log('\nDry run only. Re-run with --apply, CONFIGURATION_SERVICE_URL and ADSP_TOKEN to apply.');
    return;
  }

  if (!configurationUrl || !token) {
    throw new Error('CONFIGURATION_SERVICE_URL and ADSP_TOKEN are required with --apply.');
  }
  for (const [service, patch] of Object.entries(patches)) {
    await applyPatch(configurationUrl, token, service, patch);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
