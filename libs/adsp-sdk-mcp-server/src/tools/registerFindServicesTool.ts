import { z } from 'zod';
import { CapabilityCatalog } from '../capabilities/catalog';
import { NeedResult, ServiceFinder, ServiceMatch } from '../capabilities/findServices';
import { buildNext, definedOnly, Next } from './envelope';
import { LinkIndex } from './links';
import { OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

const MAX_NEEDS = 50;

const FindArgs = z
  .object({
    need: z.string().trim().min(1).optional(),
    needs: z.array(z.string().trim().min(1)).min(1).max(MAX_NEEDS).optional(),
    response_format: z.enum(['concise', 'detailed']).optional(),
  })
  .refine(({ need, needs }) => Boolean(need) !== Boolean(needs), { message: 'Pass exactly one of need or needs.' });

export type FindServicesLinks = Pick<LinkIndex, 'hasDoc' | 'hasServiceApi'>;

type ResponseFormat = 'concise' | 'detailed';

const MATCH_PROPERTIES = {
  service: { type: 'string', description: 'Service id, e.g. "file-service".' },
  fit: { type: 'string', enum: ['strong', 'partial', 'weak'] },
  reason: { type: 'string', description: 'The catalog sentence that best explains the match.' },
  name: { type: 'string' },
  dependsOn: { type: 'array', items: { type: 'string' }, description: 'Services to set up first.' },
  registration: {
    type: 'object',
    description:
      'How a service built with @abgov/adsp-service-sdk configures it: the ServiceRegistration fields written to ' +
      'this service, and the serviceId to use in a serviceConfigurations entry when the service takes ' +
      'configuration from yours (check that with get_service_configuration_schema).',
    properties: {
      fields: { type: 'array', items: { type: 'string' } },
      serviceConfigurations: { type: 'string' },
    },
    required: ['fields', 'serviceConfigurations'],
  },
  doc: { type: 'string', description: 'Service guide path, for read_adsp_doc.' },
  fitQuestions: { type: 'array', items: { type: 'string' } },
  risks: { type: 'array', items: { type: 'string' } },
  specialist: {
    type: 'boolean',
    description: 'False when project-planner-service has no specialist for the service, so it has no fit questions.',
  },
} as const;

const KNOWN_GAP_PROPERTIES = {
  requirement: { type: 'string' },
  reason: { type: 'string' },
  suggestedApproach: { type: 'string' },
} as const;

export const FIND_SERVICES_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          need: { type: 'string' },
          ask: {
            type: 'boolean',
            description: 'True when no service is a strong fit or more than one is. Ask the user instead of choosing.',
          },
          fitQuestions: { type: 'array', items: { type: 'string' }, description: 'What to ask when ask is true.' },
          matches: {
            type: 'array',
            items: { type: 'object', properties: MATCH_PROPERTIES, required: ['service', 'fit', 'reason'] },
          },
          noMatch: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              reason: { type: 'string' },
              knownGap: {
                type: 'object',
                properties: KNOWN_GAP_PROPERTIES,
                required: ['requirement', 'reason', 'suggestedApproach'],
              },
            },
            required: ['need', 'reason'],
          },
        },
        required: ['need', 'ask', 'fitQuestions', 'matches'],
      },
    },
    next: {
      type: 'object',
      description: 'Calls worth making next.',
      properties: {
        suggested_calls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              arguments: { type: 'object' },
              why: { type: 'string' },
            },
            required: ['tool', 'arguments', 'why'],
          },
        },
      },
      required: ['suggested_calls'],
    },
  },
  required: ['results'],
} as const;

function formatMatch({ service, fit, reason }: ServiceMatch, format: ResponseFormat) {
  if (format === 'concise') {
    return { service: service.id, fit, reason };
  }
  return {
    service: service.id,
    fit,
    reason,
    name: service.name,
    dependsOn: service.dependsOn,
    registration: { fields: service.registrationFields, serviceConfigurations: `urn:ads:platform:${service.id}` },
    doc: service.doc,
    fitQuestions: service.fitQuestions,
    risks: service.risks,
    specialist: service.specialist,
  };
}

function formatResult({ need, matches, ask, fitQuestions, noMatch }: NeedResult, format: ResponseFormat) {
  return {
    need,
    ask,
    fitQuestions,
    matches: matches.map((match) => formatMatch(match, format)),
    ...(noMatch && { noMatch: { need, ...noMatch } }),
  };
}

function suggestNext(
  results: NeedResult[],
  links: FindServicesLinks,
  current: Record<string, unknown>,
): Next | undefined {
  for (const { need, matches } of results) {
    const strong = matches.find(({ fit }) => fit === 'strong');
    if (strong) {
      const { id, doc } = strong.service;
      return buildNext(
        [
          links.hasDoc(doc) ? { tool: 'read_adsp_doc', arguments: { path: doc }, why: 'Read its guide.' } : undefined,
          links.hasServiceApi(id)
            ? {
                tool: 'search_service_endpoints',
                arguments: { query: need, service: id },
                why: 'Find its REST endpoints.',
              }
            : undefined,
        ],
        { tool: 'find_adsp_services', arguments: current },
      );
    }
  }
  return undefined;
}

export function createFindServicesTool(
  catalog: () => CapabilityCatalog,
  links: () => FindServicesLinks,
): ToolDefinition[] {
  let finder: ServiceFinder | undefined;

  return [
    {
      name: 'find_adsp_services',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        'Match a product need, described in your own words, to the ADSP services that provide it, ranked by fit. ' +
        'Pass one need, or several requirement lines as needs. Each match has a fit level (strong, partial or ' +
        'weak) and the reason it fits; response_format "detailed" adds dependencies, how to register with the ' +
        'service from @abgov/adsp-service-sdk, the guide to read next, fit questions and risks. When ask is true, ' +
        'ask the user the fitQuestions before choosing. A noMatch entry records that no ADSP service covers the ' +
        'need, with a suggested approach when the gap is known. Answers from a catalog bundled at build time.',
      inputSchema: {
        type: 'object',
        properties: {
          need: {
            type: 'string',
            description: 'One need, e.g. "applicants attach supporting documents to an application".',
          },
          needs: {
            type: 'array',
            items: { type: 'string' },
            description: `Several needs, such as requirement lines, matched one by one (at most ${MAX_NEEDS}). Pass this or need.`,
          },
          response_format: {
            type: 'string',
            enum: ['concise', 'detailed'],
            description: '"concise" (default): service, fit and reason. "detailed": every field.',
          },
        },
      },
      outputSchema: FIND_SERVICES_OUTPUT_SCHEMA,
      handler: (args) => {
        const parsed = FindArgs.safeParse(args);
        if (!parsed.success) {
          return {
            isError: true,
            content: [{ type: 'text', text: parsed.error.issues.map(({ message }) => message).join(' ') }],
          };
        }

        const { need, needs, response_format: format = 'concise' } = parsed.data;
        const current = (finder ??= new ServiceFinder(catalog()));
        const found = (needs ?? [need as string]).map((text) => current.find(text));
        const next = suggestNext(found, links(), definedOnly(parsed.data));
        const structuredContent = {
          results: found.map((result) => formatResult(result, format)),
          ...(next && { next }),
        };
        return { structuredContent, content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }] };
      },
    },
  ];
}
