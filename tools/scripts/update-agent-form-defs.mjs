/**
 * Script to update form definitions tagged with "agent-service" in the Configuration Service.
 * 
 * Flow:
 * 1. Authenticate via Keycloak client credentials
 * 2. Use Directory Service to discover Configuration Service URL
 * 3. Use Directory Service resource/tag API to find form defs tagged "agent-service"
 * 4. Use Configuration Service to read and update those form definitions
 * 
 * Usage: node tools/scripts/update-agent-form-defs.mjs
 */
import https from 'https';
import { URL } from 'url';

const KEYCLOAK_ROOT_URL = 'https://access.adsp-dev.gov.ab.ca';
const DIRECTORY_URL = 'https://directory-service.adsp-dev.gov.ab.ca';
const REALM = 'b6aff762-20f8-4c5d-88d3-c38ae16d1937';
const CLIENT_ID = 'urn:ads:subbu:agent-service';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'mpIz0E2ITrodHNa7DQJQ6dg3CuXRJ34J';
const TENANT_ID = `urn:ads:platform:tenant-service:v2:/tenants/${REALM}`;
const TAG = 'agent-examples';

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const tokenUrl = `${KEYCLOAK_ROOT_URL}/auth/realms/${REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString();

  const res = await httpsRequest(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, body);

  if (res.status !== 200) {
    throw new Error(`Token request failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data.access_token;
}

async function discoverServiceUrl(token, urn) {
  const dirUrl = `${DIRECTORY_URL}/directory/v2/namespaces/platform/entries`;
  const res = await httpsRequest(dirUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) {
    throw new Error(`Directory lookup failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
  
  for (const entry of res.data) {
    if (entry.urn === urn) {
      return entry.url;
    }
  }
  throw new Error(`Could not find ${urn} in directory`);
}

// --- Directory Service: find resources by tag ---
async function getResourcesByTag(token, tag) {
  const url = `${DIRECTORY_URL}/resource/v1/tags/${encodeURIComponent(tag)}/resources?top=100&includeRepresents=true`;
  const res = await httpsRequest(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) {
    throw new Error(`Tag lookup failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

// --- Configuration Service: get a form definition ---
async function getFormDefinitionConfig(token, configServiceUrl, definitionId) {
  const url = `${configServiceUrl}/configuration/v2/configuration/form-service/${encodeURIComponent(definitionId)}/latest`;
  const res = await httpsRequest(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) {
    throw new Error(`Get config failed for ${definitionId} (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

// --- Configuration Service: update a form definition ---
async function updateFormDefinitionConfig(token, configServiceUrl, definitionId, configuration) {
  const url = `${configServiceUrl}/configuration/v2/configuration/form-service/${encodeURIComponent(definitionId)}`;
  const body = JSON.stringify({
    operation: 'REPLACE',
    configuration,
  });

  const res = await httpsRequest(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, body);

  if (res.status !== 200) {
    throw new Error(`Update config failed for ${definitionId} (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

// --- Extract form definition ID from resource URN ---
function extractFormDefId(urn) {
  // URN: urn:ads:platform:configuration-service:v2:/configuration/form-service/<id>
  const match = urn.match(/\/configuration\/form-service\/(.+)$/);
  if (match) return match[1];
  const parts = urn.split('/');
  return parts[parts.length - 1];
}

// --- Tag a resource in the directory service ---
async function tagResource(token, tag, resourceUrn) {
  const url = `${DIRECTORY_URL}/resource/v1/tags`;
  const body = JSON.stringify({
    operation: 'tag-resource',
    tag: { label: tag, value: tag },
    resource: { urn: resourceUrn },
  });

  const res = await httpsRequest(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, body);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Tag resource failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

// --- Load JSON example files from the agent-service data directory ---
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '../../apps/agent-service/src/agent/agents/data/form-examples');

function loadExample(category, filename) {
  const filePath = join(EXAMPLES_DIR, category, filename);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// Build form definition from an example JSON file
function exampleToFormDefinition(example) {
  return {
    id: example.id,
    name: example.name,
    description: example.summary || '',
    dataSchema: example.dataSchema || { type: 'object', properties: {} },
    uiSchema: example.uiSchema || { type: 'VerticalLayout', elements: [] },
    applicantRoles: ['applicant'],
    assessorRoles: [],
    clerkRoles: [],
    anonymousApply: false,
  };
}

async function main() {
  console.log('Step 1: Getting access token...');
  const token = await getAccessToken();
  console.log('Token acquired successfully');

  console.log('\nStep 2: Discovering Configuration Service URL...');
  const configServiceUrl = await discoverServiceUrl(token, 'urn:ads:platform:configuration-service');
  console.log('Configuration Service URL:', configServiceUrl);

  console.log(`\nStep 3: Finding resources tagged "${TAG}" via Directory Service...`);
  const taggedResources = await getResourcesByTag(token, TAG);
  const resources = Array.isArray(taggedResources.results) ? taggedResources.results : 
                    Array.isArray(taggedResources) ? taggedResources : [];
  
  const taggedIds = new Set(resources.map(r => extractFormDefId(r.urn)));
  console.log(`Found ${taggedIds.size} tagged form definitions`);

  // These are the examples we modified/added for the Categorization/Category training
  const examplesToUpdate = [
    { category: 'layouts', file: 'pages-layout.json' },
    { category: 'layouts', file: 'stepper-with-sections.json' },
    { category: 'layouts', file: 'simple-stepper.json' },
  ];

  console.log('\nStep 4: Updating form definitions in Configuration Service...');
  for (const { category, file } of examplesToUpdate) {
    const example = loadExample(category, file);
    const defId = example.id;
    const formDef = exampleToFormDefinition(example);
    
    console.log(`\n  Updating "${defId}" (${example.name})...`);
    
    try {
      // First check if it exists
      try {
        const existing = await getFormDefinitionConfig(token, configServiceUrl, defId);
        console.log(`    Existing definition found (revision ${existing.revision || 'unknown'})`);
      } catch (e) {
        console.log(`    Definition doesn't exist yet, will create via REPLACE`);
      }
      
      // PATCH with REPLACE to create or update
      const result = await updateFormDefinitionConfig(token, configServiceUrl, defId, formDef);
      console.log(`    Updated successfully`);
      
      // Tag it if not already tagged
      if (!taggedIds.has(defId)) {
        const resourceUrn = `urn:ads:platform:configuration-service:v2:/configuration/form-service/${defId}`;
        console.log(`    Tagging with "${TAG}"...`);
        await tagResource(token, TAG, resourceUrn);
        console.log(`    Tagged successfully`);
      } else {
        console.log(`    Already tagged with "${TAG}"`);
      }
    } catch (err) {
      console.error(`    ERROR: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
