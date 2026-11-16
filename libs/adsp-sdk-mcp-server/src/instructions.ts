/**
 * Returned in the initialize result. Covers only what no single tool description can: which tool answers which
 * kind of question, which tools need a login, and how fresh the bundled content is. Keep it short and never restate
 * a tool description (server.spec.ts checks this); clients may truncate or ignore instructions.
 */
export const SERVER_INSTRUCTIONS = [
  'Use this server to build services and apps on ADSP (Alberta Digital Service Platform). Pick the tool by the question:',
  '- What ADSP offers, which service fits a need, platform concepts or how-tos: search_adsp_docs, then read_adsp_doc.',
  '  Search matches words, not meaning. If a need described in product terms finds nothing useful, search again with',
  '  the capability\'s name (e.g. "file", "calendar", "notification") or browse services/ with list_adsp_docs.',
  '- Writing a Node service: get_platform_quickstart first, then search_sdk_reference for a specific symbol.',
  "- Calling a service's REST API: search_service_endpoints, then read_service_endpoint.",
  '- Roles a service account needs, or the configuration a platform service accepts from yours: list_service_roles,',
  '  get_service_configuration_schema. Only these two reach the live platform; the user must run',
  '  `npx @abgov/adsp-cli login` first. Every other tool answers offline from content bundled at build time.',
  'Bundled content can lag the platform. get_adsp_mcp_server_info says when and from which commit it was built;',
  'mention that when a detail may be out of date.',
].join('\n');
