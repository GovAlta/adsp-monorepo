import { TokenProvider } from '@abgov/adsp-service-sdk';
import axios, { isAxiosError } from 'axios';

export interface FormDefinitionSchemas {
  dataSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

export interface FormDefinitionLatest extends FormDefinitionSchemas {
  id?: string;
  name?: string;
  description?: string;
  anonymousApply?: boolean;
  applicantRoles?: string[];
  assessorRoles?: string[];
}

interface FormDefinitionClientProps {
  configurationServiceUrl: URL;
  tokenProvider: TokenProvider;
}

const TRANSIENT_RETRY_DELAY_MS = 500;

function isTransientError(err: unknown): boolean {
  if (!isAxiosError(err)) {
    return false;
  }

  const status = err.response?.status;
  return status === undefined || status === 429 || status >= 500;
}

// A generation run saves many times in sequence; one retry keeps a blip from ending the run.
async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (!isTransientError(err)) {
      throw err;
    }

    await new Promise((resolve) => setTimeout(resolve, TRANSIENT_RETRY_DELAY_MS));
    return await operation();
  }
}

export async function getLatestFormDefinition(
  { configurationServiceUrl, tokenProvider }: FormDefinitionClientProps,
  tenantId: string | undefined,
  formDefinitionId: string,
): Promise<FormDefinitionLatest> {
  const latestUrl = new URL(`v2/configuration/form-service/${formDefinitionId}/latest`, configurationServiceUrl);
  const { data } = await withTransientRetry(async () =>
    axios.get(latestUrl.href, {
      params: { tenantId },
      headers: { Authorization: `Bearer ${await tokenProvider.getAccessToken()}` },
    }),
  );

  const configuration = unwrapConfiguration(data);
  if (!configuration) {
    throw new Error(
      `Configuration service returned an unusable response for form definition '${formDefinitionId}' (${typeof data}).`,
    );
  }

  return {
    ...configuration,
    dataSchema: (configuration.dataSchema ?? {}) as Record<string, unknown>,
    uiSchema: (configuration.uiSchema ?? {}) as Record<string, unknown>,
  };
}

// Reads return the configuration directly, writes nest it under latest; a gateway error page arrives as a string.
function unwrapConfiguration(data: unknown): Record<string, unknown> | null {
  const candidate = (data as { latest?: { configuration?: unknown } })?.latest?.configuration ?? data;
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? (candidate as Record<string, unknown>)
    : null;
}

export async function updateFormDefinitionSchemas(
  { configurationServiceUrl, tokenProvider }: FormDefinitionClientProps,
  tenantId: string | undefined,
  formDefinitionId: string,
  update: FormDefinitionSchemas,
): Promise<FormDefinitionLatest> {
  const updateUrl = new URL(`v2/configuration/form-service/${formDefinitionId}`, configurationServiceUrl);

  try {
    const { data } = await withTransientRetry(async () =>
      axios.patch(
        updateUrl.href,
        {
          operation: 'UPDATE',
          update: { id: formDefinitionId, dataSchema: update.dataSchema, uiSchema: update.uiSchema },
        },
        {
          params: { tenantId },
          headers: { Authorization: `Bearer ${await tokenProvider.getAccessToken()}` },
        },
      ),
    );

    return data?.latest?.configuration ?? data;
  } catch (err) {
    throw new Error(formatConfigurationUpdateError(err));
  }
}

function formatConfigurationUpdateError(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const errorData = err.response?.data;
    if (status === 400) {
      return `Schema validation failed: ${errorData?.message ?? 'unknown error'}. Check that UI schema scopes match dataSchema properties.`;
    }
    if (status === 403) {
      return 'Permission denied. You need the configuration-admin role to update form configurations.';
    }
    if (status === 404) {
      return 'Form configuration not found. The form definition may not exist or you may not have access to it.';
    }
    if (errorData?.message) {
      return `Configuration service error: ${errorData.message}`;
    }
  }

  const msg = err instanceof Error ? err.message : String(err);
  return `Failed to update form schema: ${msg}`;
}
