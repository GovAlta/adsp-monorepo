import { z } from 'zod';
import { ApiServiceSummary, ApiSpecsRepository } from '../api-specs/apiSpecsRepository';
import { diagnose } from '../diagnostics/diagnose';
import { buildNext, jsonText, withRelatedAndNext } from './envelope';
import { OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

const DiagnoseArgs = z.object({
  symptom: z.string('symptom is required.').trim().min(1, 'symptom must not be empty.'),
});

const NO_MATCH =
  'No known ADSP error matches that symptom. This tool recognises: a 401 or 403 on a call between services; ' +
  '`req.getConfiguration()` returning undefined; `req.tenant` not being set; a failed directory lookup; and the ' +
  'SDK failing to get its access token. Paste the exact error message if you have one, or try search_adsp_docs.';

// Source checkouts and tests have no bundled API index; URNs written in the symptom still work without it.
function listServices(loadApis: () => ApiSpecsRepository): ApiServiceSummary[] {
  try {
    return loadApis().list();
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export function createDiagnoseTool(loadApis: () => ApiSpecsRepository): ToolDefinition[] {
  return [
    {
      name: 'diagnose_adsp_error',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        'Diagnose an error a Node service built on @abgov/adsp-service-sdk hits when it calls ADSP: give the ' +
        'symptom (a status code such as 401, an error message, or a short description) and get the likely causes, ' +
        'most likely first, each with its fix, a check that tells them apart, and the tool to call next. Works ' +
        'offline from what the SDK and the bundled docs say.',
      inputSchema: {
        type: 'object',
        properties: {
          symptom: {
            type: 'string',
            description: 'What went wrong, e.g. "401 calling file-service", or the exact error message.',
          },
        },
        required: ['symptom'],
      },
      handler: (args) => {
        const parsed = DiagnoseArgs.safeParse(args);
        if (!parsed.success) {
          // clean-code-ignore: 2.18 — isError is the standard MCP CallToolResult field for a handled failure, not a hidden side effect.
          return {
            isError: true,
            content: [{ type: 'text', text: parsed.error.issues.map(({ message }) => message).join(' ') }],
          };
        }

        const diagnoses = diagnose(parsed.data.symptom, listServices(loadApis));
        if (diagnoses.length === 0) {
          return { content: [{ type: 'text', text: NO_MATCH }] };
        }

        // followUp stays on each diagnosis because it says which calls need sign-in; buildNext drops those.
        const next = buildNext(
          diagnoses.flatMap(({ followUp = [] }) =>
            followUp.map(({ tool, arguments: args, why }) => ({ tool, arguments: args, why })),
          ),
          { tool: 'diagnose_adsp_error', arguments: { symptom: parsed.data.symptom } },
        );
        return jsonText(withRelatedAndNext({ diagnoses }, undefined, next));
      },
    },
  ];
}
