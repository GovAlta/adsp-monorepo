import { PIIDetector } from '@mastra/core/processors';
import { getAgentModelConfiguration } from '../../model/modelConfiguration';
import { ACCESS_SERVICE_PII_TYPES } from './piiGuardrailConfig';

export function createAccessServicePiiDetector(): PIIDetector {
  return new PIIDetector({
    model: getAgentModelConfiguration(),
    detectionTypes: ACCESS_SERVICE_PII_TYPES,
    threshold: 0.6,
    strategy: 'redact',
    redactionMethod: 'placeholder',
    includeDetections: false,
    instructions:
      'Redact personal identifiers. Preserve technical identifiers used for troubleshooting, including ADSP URNs, Keycloak realm and client IDs, role names, JWT claim names, URLs, and hostnames unless they contain a detected personal identifier.',
  });
}
