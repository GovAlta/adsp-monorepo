/**
 * jira-client.js
 * Jira Cloud REST API client — ADSP Monorepo (CS-4961)
 *
 * Fetches ticket summary, description, and acceptance criteria from
 * the Jira Cloud REST API v3.  Used by the unit test agent to provide
 * ticket context when generating or reviewing tests.
 *
 * Requires environment variables:
 *   JIRA_BASE_URL    — e.g. https://goa-dio.atlassian.net
 *   JIRA_EMAIL       — Atlassian account email for Basic Auth
 *   JIRA_API_TOKEN   — Atlassian API token for Basic Auth
 */

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// ─────────────────────────────────────────────────────────────
// Build the Basic Auth header value from email and API token
// ─────────────────────────────────────────────────────────────
function buildAuthHeader(email, token) {
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}

// ─────────────────────────────────────────────────────────────
// Recursively extract plain text from an Atlassian Document Format (ADF) node.
// Jira Cloud REST API v3 returns description as ADF, not plain text.
// ─────────────────────────────────────────────────────────────
function adfToText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (!Array.isArray(node.content)) return '';

  const childText = node.content.map(adfToText).join('');

  if (node.type === 'paragraph' || node.type === 'heading') return childText + '\n';
  if (node.type === 'listItem') return '- ' + childText;

  return childText;
}

// ─────────────────────────────────────────────────────────────
// Pull out the "Acceptance Criteria" section from an ADF description.
// Scans top-level nodes for a heading whose text matches, then collects
// all following content nodes until the next heading is encountered.
// ─────────────────────────────────────────────────────────────
function extractAcceptanceCriteria(descriptionAdf) {
  if (!descriptionAdf || !Array.isArray(descriptionAdf.content)) return null;

  const nodes = descriptionAdf.content;
  let capturing = false;
  const parts = [];

  for (const node of nodes) {
    if (node.type === 'heading') {
      const headingText = adfToText(node).trim().toLowerCase();
      if (headingText === 'acceptance criteria') {
        capturing = true;
        continue;
      }
      if (capturing) break;
    }
    if (capturing) {
      const text = adfToText(node).trim();
      if (text) parts.push(text);
    }
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

// ─────────────────────────────────────────────────────────────
// Fetch a Jira ticket and return its summary, description, and
// acceptance criteria.  Returns null with a logged warning if
// credentials are missing, the network is unreachable, or the
// ticket does not exist.
// ─────────────────────────────────────────────────────────────
async function fetchTicket(ticketId) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.warn(
      '  Jira credentials not configured — skipping ticket fetch' +
        ' (JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN are required)',
    );
    return null;
  }

  const url = `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3/issue/${encodeURIComponent(ticketId)}`;

  let response;
  try {
    response = await globalThis.fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: buildAuthHeader(JIRA_EMAIL, JIRA_API_TOKEN),
      },
    });
  } catch (err) {
    console.warn(`  Jira unreachable — skipping ticket fetch for ${ticketId}: ${err.message}`);
    return null;
  }

  if (response.status === 404) {
    console.warn(`  Jira ticket ${ticketId} not found (404) — skipping`);
    return null;
  }

  if (!response.ok) {
    console.warn(`  Jira API returned ${response.status} for ${ticketId} — skipping ticket fetch`);
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.warn(`  Could not parse Jira response for ${ticketId}: ${err.message}`);
    return null;
  }

  const fields = data.fields || {};
  const summary = fields.summary || null;
  const description = fields.description ? adfToText(fields.description).trim() || null : null;
  const acceptanceCriteria = fields.description ? extractAcceptanceCriteria(fields.description) : null;

  return { summary, description, acceptanceCriteria };
}

// Guard against auto-execution when this module is require()'d by the test suite
if (require.main === module) {
  const ticketId = process.argv[2];
  if (!ticketId) {
    console.error('Usage: node .github/scripts/jira-client.js <TICKET-ID>');
    process.exit(1);
  }
  fetchTicket(ticketId)
    .then((ticket) => {
      if (ticket) {
        console.log(JSON.stringify(ticket, null, 2));
      } else {
        console.log('Could not fetch ticket.');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('❌ jira-client failed:', err);
      process.exit(1);
    });
}

module.exports = {
  buildAuthHeader,
  adfToText,
  extractAcceptanceCriteria,
  fetchTicket,
};
