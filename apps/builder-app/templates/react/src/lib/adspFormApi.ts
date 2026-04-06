import { type AdspFormStarterConfig } from '../config/adspForm';

export interface AdspFormDefinition {
  id: string;
  name: string;
  description?: string;
  dataSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

export interface AdspSubmissionReceipt {
  id: string;
  submitted: boolean;
  submittedAt: string;
}

const mockDefinition: AdspFormDefinition = {
  id: 'mock-service-application',
  name: 'Service application form',
  description:
    'A starter form used for Builder prototyping before connecting a live ADSP definition.',
  dataSchema: {
    type: 'object',
    required: ['fullName', 'email', 'programStream'],
    properties: {
      fullName: {
        type: 'string',
        title: 'Full legal name',
        minLength: 2,
      },
      email: {
        type: 'string',
        title: 'Email address',
        format: 'email',
      },
      phoneNumber: {
        type: 'string',
        title: 'Phone number',
      },
      programStream: {
        type: 'string',
        title: 'Program stream',
        enum: ['General intake', 'Rural support', 'Seniors support'],
      },
      consent: {
        type: 'boolean',
        title: 'I confirm this information is accurate.',
      },
    },
  },
  uiSchema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        label: 'Applicant details',
        scope: '#/properties/fullName',
      },
      {
        type: 'Control',
        scope: '#/properties/email',
      },
      {
        type: 'Control',
        scope: '#/properties/phoneNumber',
      },
      {
        type: 'Control',
        scope: '#/properties/programStream',
      },
      {
        type: 'Control',
        scope: '#/properties/consent',
      },
    ],
  },
};

function buildHeaders(config: AdspFormStarterConfig): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = config.accessToken?.trim();
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  return headers;
}

function pickDefinition(source: unknown, fallbackId: string): AdspFormDefinition | null {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const obj = source as Record<string, unknown>;
  const dataSchema = obj.dataSchema;
  const uiSchema = obj.uiSchema;

  if (!dataSchema || !uiSchema || typeof dataSchema !== 'object' || typeof uiSchema !== 'object') {
    return null;
  }

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : fallbackId,
    name:
      (typeof obj.name === 'string' && obj.name) ||
      (typeof obj.title === 'string' && obj.title) ||
      'ADSP form',
    description: typeof obj.description === 'string' ? obj.description : undefined,
    dataSchema: dataSchema as Record<string, unknown>,
    uiSchema: uiSchema as Record<string, unknown>,
  };
}

function resolveDefinition(payload: unknown, fallbackId: string): AdspFormDefinition {
  const direct = pickDefinition(payload, fallbackId);
  if (direct) {
    return direct;
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const nestedCandidates = [obj.definition, obj.formDefinition, obj.result];
    for (const candidate of nestedCandidates) {
      const nested = pickDefinition(candidate, fallbackId);
      if (nested) {
        return nested;
      }
    }
  }

  throw new Error('Unable to parse ADSP form definition response.');
}

export async function loadAdspFormDefinition(
  config: AdspFormStarterConfig
): Promise<AdspFormDefinition> {
  if (config.mode === 'mock') {
    return {
      ...mockDefinition,
      name: `${config.serviceName} application`,
    };
  }

  const baseUrl = config.formServiceBaseUrl.trim();
  const definitionId = config.definitionId.trim();
  if (!baseUrl || !definitionId) {
    throw new Error('Missing ADSP formServiceBaseUrl or definitionId in src/config/adspForm.ts.');
  }

  const response = await fetch(`${baseUrl}/form/v1/form-definitions/${definitionId}`, {
    method: 'GET',
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    throw new Error(`Form definition request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;
  return resolveDefinition(payload, definitionId);
}

export async function submitAdspForm(
  config: AdspFormStarterConfig,
  definitionId: string,
  data: Record<string, unknown>
): Promise<AdspSubmissionReceipt> {
  if (config.mode === 'mock') {
    return {
      id: `mock-${Date.now()}`,
      submitted: true,
      submittedAt: new Date().toISOString(),
    };
  }

  const baseUrl = config.formServiceBaseUrl.trim();
  if (!baseUrl) {
    throw new Error('Missing ADSP formServiceBaseUrl in src/config/adspForm.ts.');
  }

  const response = await fetch(`${baseUrl}/form/v1/forms`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({
      definitionId,
      data,
      submit: config.submitOnCreate,
    }),
  });

  if (!response.ok) {
    throw new Error(`Form submission failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { id?: string; submitted?: boolean };
  return {
    id: payload.id || `submission-${Date.now()}`,
    submitted: payload.submitted ?? config.submitOnCreate,
    submittedAt: new Date().toISOString(),
  };
}
