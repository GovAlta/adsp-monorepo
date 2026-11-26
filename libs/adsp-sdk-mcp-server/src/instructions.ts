/**
 * Returned in the initialize result. Covers only what no single tool description can: which tool answers which
 * kind of question, which tools need a login, and how fresh the bundled content is. Keep it short and never restate
 * a tool description (server.spec.ts checks this); clients may truncate or ignore instructions.
 */
const TOOL_CHOICE = [
  'Use this server to build services and apps on ADSP (Alberta Digital Service Platform). Pick the tool by the question:',
  '- Before designing or building any capability of an ADSP app, call find_adsp_services with the need. If a result',
  '  has ask set, put its fitQuestions to the user rather than picking a service yourself. noMatch: no service fits.',
  '- Platform concepts or how-tos: search_adsp_docs, then read_adsp_doc. Browse services/ with list_adsp_docs.',
  '- Writing a Node service: get_platform_quickstart first, then search_sdk_reference. A browser app: get_app_quickstart.',
  "- Calling a service's REST API: search_service_endpoints, then read_service_endpoint.",
];

const CONTENT_FRESHNESS = [
  'Results may carry next.suggested_calls (a tool and its arguments, to call as given) and related (paths and names).',
  'Bundled content can lag the platform. get_adsp_mcp_server_info says when and from which commit it was built;',
  'mention that when a detail may be out of date.',
];

export const SERVER_INSTRUCTIONS = [
  ...TOOL_CHOICE,
  '- Roles a service account needs, or the configuration a platform service accepts from yours: list_service_roles,',
  '  get_service_configuration_schema. Only these two reach the live platform; the user must run',
  '  `npx @abgov/adsp-cli login` first. Every other tool answers offline from content bundled at build time.',
  ...CONTENT_FRESHNESS,
].join('\n');

/** For the hosted /mcp endpoint, which serves only the offline tools and never asks for a sign-in. */
export const OFFLINE_ENDPOINT_INSTRUCTIONS = [
  ...TOOL_CHOICE,
  '- Roles a service account needs, or the configuration a platform service accepts from yours, are read live and',
  '  need a sign-in: connect to /mcp/<tenant realm> on this server instead. Every tool here answers offline.',
  ...CONTENT_FRESHNESS,
].join('\n');
