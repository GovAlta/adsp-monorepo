import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import {
  ConfigurationClient,
  ConfigurationDocument,
  ConfigurationRevision,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import {
  DataRegisterCreateRequest,
  DataRegisterDefinition,
  DataRegisterEntry,
  DataRegisterResponse,
  DataRegisterUpdateRequest,
} from './types/register';

export const DATA_REGISTER_NAMESPACE = 'data-register';

// Schema stored against the definition so configuration-service (and jsonforms) can tell a data register apart
// from any other array-typed configuration document.
export const REGISTER_SCHEMA = {
  type: 'array',
  items: {
    anyOf: [{ type: 'string' }, { type: 'object' }],
  },
};

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

const getDefinitionKey = (name: string): string => `${DATA_REGISTER_NAMESPACE}:${name}`;

const isRegisterDefinition = (definition: DataRegisterDefinition): boolean =>
  !!definition && (definition.configurationSchema as { type?: string })?.type === 'array';

type DataRevision = ConfigurationRevision<DataRegisterEntry[]>;
type DataDocument = ConfigurationDocument<DataRegisterEntry[]>;

interface DataListResult extends DataDocument {
  name: string;
  namespace: string;
}

interface DataListResponse {
  results: DataListResult[];
  page: { next?: string };
}

// Active revision wins, falling back to latest so a register with no active revision set is still usable. Anything
// but an entries array (no revision at all, or a revision created before any entries were written) is not a register.
const resolveEntries = (document: DataDocument): DataRegisterEntry[] | undefined => {
  const configuration = (document.active ?? document.latest)?.configuration;
  return Array.isArray(configuration) ? configuration : undefined;
};

// A configuration-service 4xx (other than 401/403, which mean form-service's own service account is missing a
// role) is the caller's fault and maps to 400. Anything else configuration-service does wrong is not the caller's
// fault, so it maps to 502 rather than a plain GoAError, which createErrorHandler would otherwise turn into a 500.
const mapConfigurationError = (err: unknown): Error => {
  if (err instanceof NotFoundError || err instanceof InvalidOperationError) {
    return err;
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const message = (err.response?.data as { errorMessage?: string })?.errorMessage || err.message;
    const isCallerFault =
      status >= 400 && status < 500 && status !== HttpStatusCodes.UNAUTHORIZED && status !== HttpStatusCodes.FORBIDDEN;

    return isCallerFault
      ? new InvalidOperationError(message)
      : new InvalidOperationError(message, { statusCode: HttpStatusCodes.BAD_GATEWAY });
  }

  return err as Error;
};

/**
 * Reads and writes data registers, each made up of a definition (in the shared platform/configuration-service
 * document) and a data document (configuration/data-register/<name>) holding the entries array. Both parts must
 * be present for a register to be considered to exist; find/get/create/update/delete are written so a partial
 * failure (e.g. definition written, data write failed) is safe to retry.
 */
export class DataRegisterClient {
  private definitions: ConfigurationClient<Record<string, DataRegisterDefinition>>;

  constructor(
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
  ) {
    this.definitions = new ConfigurationClient<Record<string, DataRegisterDefinition>>(
      directory,
      tokenProvider,
      'platform',
      'configuration-service',
    );
  }

  public async find(tenantId: AdspId): Promise<DataRegisterResponse[]> {
    try {
      const [definitions, dataByName] = await Promise.all([
        this.definitions.getTenantConfiguration(tenantId),
        this.listData(tenantId),
      ]);

      return Object.entries(definitions)
        .filter(
          ([key, definition]) => key.startsWith(`${DATA_REGISTER_NAMESPACE}:`) && isRegisterDefinition(definition),
        )
        .map(([key, definition]) => {
          const name = key.slice(DATA_REGISTER_NAMESPACE.length + 1);
          const entries = dataByName.get(name);
          return entries !== undefined ? this.toResponse(name, definition, entries) : null;
        })
        .filter((register): register is DataRegisterResponse => register !== null);
    } catch (err) {
      throw mapConfigurationError(err);
    }
  }

  public async get(tenantId: AdspId, name: string): Promise<DataRegisterResponse> {
    try {
      const [definitions, entries] = await Promise.all([
        this.definitions.getTenantConfiguration(tenantId),
        this.getData(tenantId, name),
      ]);

      const definition = definitions[getDefinitionKey(name)];
      if (!isRegisterDefinition(definition) || entries === undefined) {
        throw new NotFoundError('data register', name);
      }

      return this.toResponse(name, definition, entries);
    } catch (err) {
      throw mapConfigurationError(err);
    }
  }

  public async create(tenantId: AdspId, request: DataRegisterCreateRequest): Promise<DataRegisterResponse> {
    try {
      const { name, description = '', entries = [] } = request;

      const [definitions, document] = await Promise.all([
        this.definitions.getTenantConfiguration(tenantId),
        this.getDataDocument(tenantId, name),
      ]);

      if (isRegisterDefinition(definitions[getDefinitionKey(name)]) && resolveEntries(document) !== undefined) {
        throw new InvalidOperationError(`Data register '${name}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      // Definition is written first so the data write below never validates against a stale leftover definition.
      await this.definitions.updateEntry(tenantId, getDefinitionKey(name), {
        configurationSchema: REGISTER_SCHEMA,
        description,
      });
      const savedEntries = await this.replaceData(tenantId, name, entries, document.active);

      return { namespace: DATA_REGISTER_NAMESPACE, name, description, entries: savedEntries };
    } catch (err) {
      throw mapConfigurationError(err);
    }
  }

  public async update(
    tenantId: AdspId,
    name: string,
    request: DataRegisterUpdateRequest,
  ): Promise<DataRegisterResponse> {
    try {
      const { description, entries } = request;

      const [definitions, document] = await Promise.all([
        this.definitions.getTenantConfiguration(tenantId),
        this.getDataDocument(tenantId, name),
      ]);

      const existingEntries = resolveEntries(document);
      const existingDefinition = definitions[getDefinitionKey(name)];
      if (!isRegisterDefinition(existingDefinition) || existingEntries === undefined) {
        throw new NotFoundError('data register', name);
      }

      // Entries are written first: they are what configuration-service validates against the register's schema, so
      // a rejected update fails before the description is touched and the register is left unchanged.
      const updatedEntries =
        entries !== undefined ? await this.replaceData(tenantId, name, entries, document.active) : existingEntries;

      let definition = existingDefinition;
      if (description !== undefined) {
        definition = { ...existingDefinition, description };
        await this.definitions.updateEntry(tenantId, getDefinitionKey(name), definition);
      }

      return this.toResponse(name, definition, updatedEntries);
    } catch (err) {
      throw mapConfigurationError(err);
    }
  }

  public async delete(tenantId: AdspId, name: string): Promise<void> {
    try {
      const [definitions, existingEntries] = await Promise.all([
        this.definitions.getTenantConfiguration(tenantId),
        this.getData(tenantId, name),
      ]);

      const hasDefinition = isRegisterDefinition(definitions[getDefinitionKey(name)]);
      const hasData = existingEntries !== undefined;
      if (!hasDefinition && !hasData) {
        throw new NotFoundError('data register', name);
      }

      if (hasData) {
        await this.getDataClient(name).deleteConfiguration(tenantId);
      }
      if (hasDefinition) {
        await this.definitions.deleteEntry(tenantId, getDefinitionKey(name));
      }
    } catch (err) {
      throw mapConfigurationError(err);
    }
  }

  private toResponse(
    name: string,
    definition: DataRegisterDefinition,
    entries: DataRegisterEntry[],
  ): DataRegisterResponse {
    return { namespace: DATA_REGISTER_NAMESPACE, name, description: definition?.description || '', entries };
  }

  private async listData(tenantId: AdspId): Promise<Map<string, DataRegisterEntry[]>> {
    const configurationApiUrl = await this.directory.getServiceUrl(configurationApiId);
    const headers = await this.getAuthHeaders();
    const dataByName = new Map<string, DataRegisterEntry[]>();

    let after: string;
    do {
      const { data } = await axios.get<DataListResponse>(
        new URL(`v2/configuration/${DATA_REGISTER_NAMESPACE}`, configurationApiUrl).href,
        { headers, params: { tenantId: tenantId.toString(), top: 1000, includeActive: true, after } },
      );

      for (const result of data.results || []) {
        const entries = resolveEntries(result);
        if (entries !== undefined) {
          dataByName.set(result.name, entries);
        }
      }

      after = data.page?.next;
    } while (after);

    return dataByName;
  }

  // Each register's entries are their own configuration document, so a client is made per register name.
  private getDataClient(name: string): ConfigurationClient<DataRegisterEntry[]> {
    return new ConfigurationClient<DataRegisterEntry[]>(
      this.directory,
      this.tokenProvider,
      DATA_REGISTER_NAMESPACE,
      name,
    );
  }

  private async getDataDocument(tenantId: AdspId, name: string): Promise<DataDocument> {
    return this.getDataClient(name).getDocument(tenantId);
  }

  private async getData(tenantId: AdspId, name: string): Promise<DataRegisterEntry[] | undefined> {
    return resolveEntries(await this.getDataDocument(tenantId, name));
  }

  // configuration-service only ever writes the latest revision, but forms read the active one. When an older
  // revision is pinned as active, the pin is moved to the revision just written so the change actually goes live.
  // REPLACE overwrites the whole document, so nothing besides these entries is published with it.
  private async replaceData(
    tenantId: AdspId,
    name: string,
    entries: DataRegisterEntry[],
    active?: DataRevision,
  ): Promise<DataRegisterEntry[]> {
    const dataClient = this.getDataClient(name);
    const latest = await dataClient.replaceConfiguration(tenantId, entries);

    if (active && latest && active.revision !== latest.revision) {
      await dataClient.setActiveRevision(tenantId, latest.revision);
    }

    return latest?.configuration ?? entries;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.tokenProvider.getAccessToken();
    return { Authorization: `Bearer ${token}` };
  }
}
