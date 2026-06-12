import { createTool } from '@mastra/core/tools';
import z from 'zod';

// Templates are versioned alongside the nx-adsp plugin they were designed for.
// Update this constant and the template content when the plugin's SDK patterns change.
const COMPATIBLE_PLUGIN_VERSION = '>=12.3.0';

// Frontend templates require the keycloak-js / Redux (React) or keycloak-angular /
// injectable-service (Angular) patterns introduced in nx-adsp 12.8.0.
const COMPATIBLE_FRONTEND_PLUGIN_VERSION = '>=12.8.0';

interface NxAdspTemplate {
  id: string;
  description: string;
  compatibleWith: string;
  newFiles?: Record<string, string>;
  integrationChanges: Record<string, { description: string; pattern: string }>;
  usageExample?: string;
}

const templates: Record<string, NxAdspTemplate> = {
  'express-service-roles': {
    id: 'express-service-roles',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description: 'Define who can access the service. Use when different users need different levels of access (e.g. admin vs standard user). Skip for fully public services with no authentication requirements.',
    newFiles: {
      'src/roles.ts': `// Service role definitions.
// Role strings follow the pattern: '{service-name}:{role-name}'.
// inTenantAdmin: true makes the role visible and assignable in the tenant admin UI.
export enum ServiceRoles {
  Admin = '{projectName}-admin',
  User = '{projectName}-user',
}
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import ServiceRoles and add a roles array to the initializeService config object. ' +
          'Each role needs: role (ServiceRoles enum value), description, and optionally inTenantAdmin.',
        pattern: `// Add import at top of file:
import { ServiceRoles } from './roles';

// Add inside the initializeService({}) config object:
roles: [
  {
    role: ServiceRoles.Admin,
    description: 'Administrator role with full access to {projectName}.',
    inTenantAdmin: true,
  },
  {
    role: ServiceRoles.User,
    description: 'Standard user role for {projectName}.',
  },
],`,
      },
    },
    usageExample: `// Check roles in a route handler via req.user:
app.get('/{projectName}/v1/admin-resource', (req, res) => {
  const user = req.user as { roles?: string[] } | undefined;
  if (!user?.roles?.includes(ServiceRoles.Admin)) {
    return res.sendStatus(403);
  }
  res.json({ message: 'Admin resource' });
});`,
  },

  'express-service-events': {
    id: 'express-service-events',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description:
      'Emit domain events when significant things happen (record created, status changed, etc.). ' +
      'Use when other systems need to react to changes or when users need an audit history. ' +
      'Skip for read-only or query-only services.',
    newFiles: {
      'src/events.ts': `import { DomainEventDefinition } from '@abgov/adsp-service-sdk';
// SDK constraint: DomainEventDefinition is a plain interface, NOT generic (no <T>).
// Only import DomainEventDefinition here — do not import EventService or DomainEventService.

// Domain event definitions for {projectName}.
// Event names use kebab-case. The namespace is set by the SDK from the serviceId.
// payloadSchema describes the event payload using JSON Schema.

export const {entityName}CreatedDefinition: DomainEventDefinition = {
  name: '{entity-name}-created',
  description: 'Signalled when a {entityName} is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the created {entityName}.' },
    },
    required: ['id'],
  },
};

export const {entityName}UpdatedDefinition: DomainEventDefinition = {
  name: '{entity-name}-updated',
  description: 'Signalled when a {entityName} is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the updated {entityName}.' },
    },
    required: ['id'],
  },
};
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import event definitions from ./events and add them to the events array in initializeService. ' +
          'The SDK automatically sets the namespace from serviceId. ' +
          'Add eventService to the capabilities destructuring only when writing route handlers that publish events.',
        pattern: `// Add import at top:
import { {entityName}CreatedDefinition, {entityName}UpdatedDefinition } from './events';

// Add inside the initializeService({}) config object:
events: [
  {entityName}CreatedDefinition,
  {entityName}UpdatedDefinition,
],`,
      },
    },
    usageExample: `// Publish a domain event in a route handler:
app.post('/{projectName}/v1/{entities}', async (req, res) => {
  // ... create entity ...
  await eventService.send({
    namespace: '{projectName}',
    name: '{entity-name}-created',
    // tenantId is omitted — the SDK derives it from the service configuration
    payload: { id: entity.id },
  });
  res.status(201).json(entity);
});`,
  },

  'express-service-configuration': {
    id: 'express-service-configuration',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description:
      'Let tenants customise service behaviour through the ADSP tenant admin UI. ' +
      'Use when different tenants need different settings (e.g. allowed statuses, intake channels, workflow steps). ' +
      'Skip if all tenants use identical behaviour.',
    newFiles: {
      'src/configuration.ts': `// Service configuration schema and types.
// Tenants configure this service via the ADSP tenant admin app.
// SDK constraint: there is no ConfigurationDefinition<T> type — export a plain configurationSchema object.
// The configuration type ({ServiceName}Configuration) is only needed in route handler type annotations.

export interface {ServiceName}Configuration {
  // Add your configuration properties here.
  setting: string;
}

export const configurationSchema = {
  type: 'object',
  properties: {
    setting: {
      type: 'string',
      description: 'Example configuration setting.',
    },
  },
  additionalProperties: false,
};
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import configurationSchema, add a configuration block to initializeService, ' +
          'and enable configuration invalidation so the service reloads config when tenants update it. ' +
          'Import the {ServiceName}Configuration type only in route handlers that call req.getServiceConfiguration.',
        pattern: `// Add import at top:
import { configurationSchema } from './configuration';

// Add inside the FIRST argument of initializeService (the service configuration object,
// NOT the second platform-options argument that contains logLevel etc.):
configuration: {
  description: 'Configuration for {projectName}.',
  schema: configurationSchema,
},
enableConfigurationInvalidation: true,`,
      },
    },
    usageExample: `// Access configuration in a route handler:
// req.getServiceConfiguration is injected by the ADSP SDK middleware — use ! to suppress TS2722.
app.get('/{projectName}/v1/config', async (req, res) => {
  const [configuration] = await req.getServiceConfiguration!<{ServiceName}Configuration, {ServiceName}Configuration>();
  res.json(configuration || {});
});`,
  },

  // ── React (redux-toolkit slice pattern) ────────────────────────────────────

  'react-app-roles': {
    id: 'react-app-roles',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Gate UI elements by Keycloak role. Use when the backend has express-service-roles and you need to ' +
      'show/hide UI based on whether the user is an admin or standard user. ' +
      'This template has NO newFiles — it only edits the existing user.slice.ts by adding hasRole() after getAccessToken. ' +
      'Always use edit_file for this template, never write_file.',
    integrationChanges: {
      'src/app/user.slice.ts': {
        description:
          'EDIT (do not replace) user.slice.ts: add hasRole() after the existing getAccessToken function. ' +
          'The clientId defaults to the app\'s own client ID but can be overridden for service-specific roles.',
        pattern: `// Add after the existing getAccessToken export:
export function hasRole(role: string, clientId = environment.access.client_id): boolean {
  const resourceAccess = keycloak?.tokenParsed?.resource_access as
    Record<string, { roles?: string[] }> | undefined;
  return resourceAccess?.[clientId]?.roles?.includes(role) ?? false;
}`,
      },
    },
    usageExample: `// In a component — import hasRole from user.slice:
import { hasRole } from './user.slice';

// Conditionally render admin UI:
{hasRole('{projectName}-admin') && (
  <GoabButton onClick={handleAdminAction}>Admin action</GoabButton>
)}`,
  },

  'react-app-events': {
    id: 'react-app-events',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Show a timeline of domain events so users can see what happened to a record. ' +
      'Use when the backend has express-service-events and users need audit history or activity feeds. ' +
      'Skip if the backend has no events or users do not need history.',
    newFiles: {
      'src/app/events.slice.ts': `import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAccessToken } from './user.slice';

const EVENT_SERVICE_URN = 'urn:ads:platform:event-service:v1';

export const EVENTS_FEATURE_KEY = 'events';

export interface EventRecord {
  namespace: string;
  name: string;
  timestamp: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

export interface EventsState {
  records: EventRecord[];
  loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
  error?: string;
}

export const loadEvents = createAsyncThunk(
  'events/load',
  async (
    criteria: { namespace?: string; name?: string },
    { getState }
  ) => {
    const state = getState() as { config: { directory: Record<string, string> } };
    const eventServiceUrl = state.config.directory[EVENT_SERVICE_URN];
    if (!eventServiceUrl) throw new Error('Event service not found in directory.');

    const token = await getAccessToken();
    const params = new URLSearchParams();
    if (criteria.namespace) params.set('namespace', criteria.namespace);
    if (criteria.name) params.set('name', criteria.name);

    const response = await fetch(
      eventServiceUrl + '/api/event/v1/events?' + params.toString(),
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (!response.ok) throw new Error('Failed to load events: ' + response.status);

    const data = await response.json();
    return (data.results ?? []) as EventRecord[];
  }
);

export const initialEventsState: EventsState = {
  records: [],
  loadingStatus: 'not loaded',
};

const eventsSlice = createSlice({
  name: EVENTS_FEATURE_KEY,
  initialState: initialEventsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadEvents.pending, (state) => { state.loadingStatus = 'loading'; })
      .addCase(loadEvents.fulfilled, (state, { payload }) => {
        state.records = payload;
        state.loadingStatus = 'loaded';
      })
      .addCase(loadEvents.rejected, (state, { error }) => {
        state.loadingStatus = 'error';
        state.error = error.message;
      });
  },
});

export const eventsReducer = eventsSlice.reducer;
export const eventsSelector = (state: { [EVENTS_FEATURE_KEY]: EventsState }) =>
  state[EVENTS_FEATURE_KEY];
`,
    },
    integrationChanges: {
      'src/store.ts': {
        description: 'Import eventsReducer and EVENTS_FEATURE_KEY and add to the store reducer map.',
        pattern: `// Add import:
import { EVENTS_FEATURE_KEY, eventsReducer } from './app/events.slice';

// Add to configureStore reducer map:
[EVENTS_FEATURE_KEY]: eventsReducer,`,
      },
    },
    usageExample: `// In a component — dispatch loadEvents and display results:
import { useDispatch, useSelector } from 'react-redux';
import { loadEvents, eventsSelector } from './events.slice';

const dispatch = useDispatch();
const { records, loadingStatus } = useSelector(eventsSelector);

useEffect(() => {
  dispatch(loadEvents({ namespace: '{projectName}' }));
}, [dispatch]);`,
  },

  'react-app-configuration': {
    id: 'react-app-configuration',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Load tenant-specific settings from the ADSP configuration service so the frontend adapts per tenant. ' +
      'Use when the backend has express-service-configuration and the UI needs to reflect tenant settings.',
    newFiles: {
      'src/app/configuration.slice.ts': `import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAccessToken } from './user.slice';

const CONFIGURATION_SERVICE_URN = 'urn:ads:platform:configuration-service:v2';

export const CONFIGURATION_FEATURE_KEY = 'configuration';

export interface {ServiceName}Configuration {
  // Add your configuration properties here.
  [key: string]: unknown;
}

export interface ConfigurationState {
  value: {ServiceName}Configuration | null;
  loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
  error?: string;
}

export const loadConfiguration = createAsyncThunk(
  'configuration/load',
  async (
    _: void,
    { getState }
  ) => {
    const state = getState() as { config: { directory: Record<string, string> } };
    const configServiceUrl = state.config.directory[CONFIGURATION_SERVICE_URN];
    if (!configServiceUrl) throw new Error('Configuration service not found in directory.');

    const token = await getAccessToken();
    const response = await fetch(
      configServiceUrl + '/api/configuration/v2/configuration/{tenant}/{projectName}/current',
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (!response.ok) throw new Error('Failed to load configuration: ' + response.status);

    const data = await response.json();
    return (data.latest?.configuration ?? {}) as {ServiceName}Configuration;
  }
);

export const initialConfigurationState: ConfigurationState = {
  value: null,
  loadingStatus: 'not loaded',
};

const configurationSlice = createSlice({
  name: CONFIGURATION_FEATURE_KEY,
  initialState: initialConfigurationState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadConfiguration.pending, (state) => { state.loadingStatus = 'loading'; })
      .addCase(loadConfiguration.fulfilled, (state, { payload }) => {
        state.value = payload;
        state.loadingStatus = 'loaded';
      })
      .addCase(loadConfiguration.rejected, (state, { error }) => {
        state.loadingStatus = 'error';
        state.error = error.message;
      });
  },
});

export const configurationReducer = configurationSlice.reducer;
export const configurationSelector = (state: { [CONFIGURATION_FEATURE_KEY]: ConfigurationState }) =>
  state[CONFIGURATION_FEATURE_KEY];
`,
    },
    integrationChanges: {
      'src/store.ts': {
        description: 'Import configurationReducer and CONFIGURATION_FEATURE_KEY and add to the store reducer map.',
        pattern: `// Add import:
import { CONFIGURATION_FEATURE_KEY, configurationReducer } from './app/configuration.slice';

// Add to configureStore reducer map:
[CONFIGURATION_FEATURE_KEY]: configurationReducer,`,
      },
    },
    usageExample: `// Dispatch on app load and read configuration in components:
import { loadConfiguration, configurationSelector } from './configuration.slice';

const { value: config } = useSelector(configurationSelector);
// Dispatch once after config.slice initializes:
dispatch(loadConfiguration());`,
  },

  'react-app-file-upload': {
    id: 'react-app-file-upload',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Let users upload and attach documents via the ADSP file service. ' +
      'Use when the backend has express-service-file-types and users need to manage attachments. ' +
      'Skip if there is no file management requirement.',
    newFiles: {
      'src/app/files.slice.ts': `import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAccessToken } from './user.slice';

const FILE_SERVICE_URN = 'urn:ads:platform:file-service:v1';

export const FILES_FEATURE_KEY = 'files';

export interface FileRecord {
  id: string;
  filename: string;
  size: number;
  created: string;
  urn: string;
}

export interface FilesState {
  files: FileRecord[];
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
}

export const uploadFile = createAsyncThunk(
  'files/upload',
  async (
    { file, typeId }: { file: File; typeId: string },
    { getState }
  ) => {
    const state = getState() as { config: { directory: Record<string, string> } };
    const fileServiceUrl = state.config.directory[FILE_SERVICE_URN];
    if (!fileServiceUrl) throw new Error('File service not found in directory.');

    const token = await getAccessToken();
    const form = new FormData();
    form.append('file', file);
    form.append('type', typeId);
    form.append('filename', file.name);

    const response = await fetch(
      fileServiceUrl + '/api/file/v1/files',
      { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form }
    );
    if (!response.ok) throw new Error('Upload failed: ' + response.status);

    return (await response.json()) as FileRecord;
  }
);

export const getFileUrl = (fileServiceUrl: string, fileId: string, token: string) =>
  fileServiceUrl + '/api/file/v1/files/' + fileId + '/download?token=' + encodeURIComponent(token);

export const initialFilesState: FilesState = {
  files: [],
  uploadStatus: 'idle',
};

const filesSlice = createSlice({
  name: FILES_FEATURE_KEY,
  initialState: initialFilesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => { state.uploadStatus = 'uploading'; })
      .addCase(uploadFile.fulfilled, (state, { payload }) => {
        state.files.push(payload);
        state.uploadStatus = 'done';
      })
      .addCase(uploadFile.rejected, (state, { error }) => {
        state.uploadStatus = 'error';
        state.error = error.message;
      });
  },
});

export const filesReducer = filesSlice.reducer;
export const filesSelector = (state: { [FILES_FEATURE_KEY]: FilesState }) =>
  state[FILES_FEATURE_KEY];
`,
    },
    integrationChanges: {
      'src/store.ts': {
        description: 'Import filesReducer and FILES_FEATURE_KEY and add to the store reducer map.',
        pattern: `// Add import:
import { FILES_FEATURE_KEY, filesReducer } from './app/files.slice';

// Add to configureStore reducer map:
[FILES_FEATURE_KEY]: filesReducer,`,
      },
    },
    usageExample: `// Upload a file from an input element:
import { uploadFile, filesSelector } from './files.slice';

const { uploadStatus } = useSelector(filesSelector);
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) dispatch(uploadFile({ file, typeId: '{projectName}-file' }));
};`,
  },

  // ── Angular (injectable service pattern) ────────────────────────────────────

  'angular-app-roles': {
    id: 'angular-app-roles',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Gate Angular UI elements by Keycloak role. Use when the backend has express-service-roles and ' +
      'you need to show/hide components based on user role. Edits protected.component.ts — does not add new files.',
    integrationChanges: {
      'src/app/protected/protected.component.ts': {
        description:
          'Inject Keycloak and add a hasRole() method that checks resource_access on the parsed token. ' +
          'The clientId defaults to the app client ID from environment.',
        pattern: `// Add import:
import { environment } from '../../environments/environment';

// Inside the component class (Keycloak is already injected via inject(Keycloak)):
hasRole(role: string, clientId = environment.access.client_id): boolean {
  const resourceAccess = this.keycloak.tokenParsed?.['resource_access'] as
    Record<string, { roles?: string[] }> | undefined;
  return resourceAccess?.[clientId]?.roles?.includes(role) ?? false;
}`,
      },
    },
    usageExample: `<!-- In the component template — show admin content conditionally: -->
@if (hasRole('{projectName}-admin')) {
  <goab-button (_click)="handleAdminAction()">Admin action</goab-button>
}`,
  },

  'angular-app-events': {
    id: 'angular-app-events',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Show domain event history in the Angular app. Use when the backend has express-service-events and ' +
      'users need to see a timeline of changes. Bearer token is attached automatically by the HTTP interceptor.',
    newFiles: {
      'src/app/events/events.service.ts': `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EventRecord {
  namespace: string;
  name: string;
  timestamp: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);

  // Bearer token is attached automatically by includeBearerTokenInterceptor.
  // Event service URL is derived from the ADSP directory service.
  private readonly eventServiceUrl = environment.directory.url.replace(
    '/directory',
    // The directory resolves urn:ads:platform:event-service:v1 at runtime;
    // for simplicity, use the well-known path on the same host.
    ''
  );

  getEvents(namespace?: string, name?: string): Observable<EventRecord[]> {
    const params: Record<string, string> = {};
    if (namespace) params['namespace'] = namespace;
    if (name) params['name'] = name;

    return this.http
      .get<{ results: EventRecord[] }>(
        environment.access.url.replace('/auth', '') + '/api/event/v1/events',
        { params }
      )
      .pipe(map((r) => r.results ?? []));
  }
}
`,
    },
    integrationChanges: {
      'src/environments/environment.ts': {
        description:
          'Add a directory.url field pointing to the ADSP directory service. ' +
          'This is pre-populated from the tenant configuration during generation.',
        pattern: `// Add directory URL alongside the existing access config:
directory: {
  url: '<directoryServiceUrl>',  // Replace with the actual URL from adsp config
},`,
      },
    },
    usageExample: `// Inject EventService and use in a component:
import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { EventService, EventRecord } from '../events/events.service';

@Component({
  imports: [AsyncPipe],
  template: \`@for (event of events; track event.correlationId) {
    <p>{{ event.name }} — {{ event.timestamp }}</p>
  }\`,
})
export class MyComponent implements OnInit {
  private eventService = inject(EventService);
  events: EventRecord[] = [];

  ngOnInit() {
    this.eventService.getEvents('{projectName}').subscribe(e => this.events = e);
  }
}`,
  },

  'angular-app-configuration': {
    id: 'angular-app-configuration',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Load tenant-specific settings from the ADSP configuration service. ' +
      'Use when the backend has express-service-configuration and the Angular app needs to adapt per tenant.',
    newFiles: {
      'src/app/configuration/configuration.service.ts': `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface {ServiceName}Configuration {
  // Add your configuration properties here.
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private http = inject(HttpClient);

  // Bearer token is attached automatically by includeBearerTokenInterceptor.
  getConfiguration(
    configServiceBaseUrl: string,
    tenant: string,
    serviceName: string
  ): Observable<{ServiceName}Configuration> {
    return this.http
      .get<{ latest?: { configuration?: {ServiceName}Configuration } }>(
        configServiceBaseUrl + '/api/configuration/v2/configuration/' + tenant + '/' + serviceName + '/current'
      )
      .pipe(map((r) => r.latest?.configuration ?? {}));
  }
}
`,
    },
    integrationChanges: {
      'src/environments/environment.ts': {
        description:
          'Add a directory.url field if not already present. The ConfigurationService uses the ' +
          'ADSP configuration service URL derived from the directory.',
        pattern: `// Add directory URL alongside the existing access config:
directory: {
  url: '<directoryServiceUrl>',  // Replace with the actual URL from adsp config
},`,
      },
    },
    usageExample: `// Inject ConfigurationService and call during initialization:
private configService = inject(ConfigurationService);

ngOnInit() {
  this.configService
    .getConfiguration(configServiceBaseUrl, '{tenant}', '{projectName}')
    .subscribe(config => {
      // Use config.someProperty
    });
}`,
  },

  'angular-app-file-upload': {
    id: 'angular-app-file-upload',
    compatibleWith: COMPATIBLE_FRONTEND_PLUGIN_VERSION,
    description:
      'Let users upload and attach documents in Angular via the ADSP file service. ' +
      'Use when the backend has express-service-file-types and users need to manage attachments.',
    newFiles: {
      'src/app/files/files.service.ts': `import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface FileRecord {
  id: string;
  filename: string;
  size: number;
  created: string;
  urn: string;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private http = inject(HttpClient);

  // Bearer token is attached automatically by includeBearerTokenInterceptor.
  upload(fileServiceBaseUrl: string, file: File, typeId: string): Observable<FileRecord> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', typeId);
    form.append('filename', file.name);

    return this.http.post<FileRecord>(
      fileServiceBaseUrl + '/api/file/v1/files',
      form
    );
  }

  getDownloadUrl(fileServiceBaseUrl: string, fileId: string): string {
    return fileServiceBaseUrl + '/api/file/v1/files/' + fileId + '/download';
  }
}
`,
    },
    integrationChanges: {
      'src/environments/environment.ts': {
        description:
          'Add a directory.url field if not already present. The FileService derives the ' +
          'file service URL from the ADSP directory.',
        pattern: `// Add directory URL alongside the existing access config:
directory: {
  url: '<directoryServiceUrl>',  // Replace with the actual URL from adsp config
},`,
      },
    },
    usageExample: `// Inject FileService and wire up a file input:
private fileService = inject(FileService);

onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    this.fileService
      .upload(fileServiceBaseUrl, file, '{projectName}-file')
      .subscribe(record => console.log('Uploaded:', record.id));
  }
}`,
  },

  // ── Backend (express-service) ───────────────────────────────────────────────

  'express-service-file-types': {
    id: 'express-service-file-types',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description:
      'Register file types so users can upload and attach documents via the ADSP file service. ' +
      'Use when users need to attach files to records (e.g. supporting documents, evidence, correspondence). ' +
      'Skip if the service has no file management.',
    newFiles: {
      'src/fileTypes.ts': `import { FileType } from '@abgov/adsp-service-sdk';
// SDK constraint: FileType has no description field.
// Valid fields: id, name, anonymousRead, readRoles, updateRoles, rules (optional), securityClassification (optional).

// File type definitions for {projectName}.
// readRoles and updateRoles use the role strings defined in roles.ts.

export const {EntityName}FileType: FileType = {
  id: '{entity-name}-file',
  name: '{EntityName} file',
  anonymousRead: false,
  readRoles: ['{projectName}-user'],
  updateRoles: ['{projectName}-admin'],
};
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import file type definitions and add them to the fileTypes array in initializeService. ' +
          'Add tokenProvider to the capabilities destructuring only in route handlers that call the file service.',
        pattern: `// Add import at top:
import { {EntityName}FileType } from './fileTypes';

// Add inside the initializeService({}) config object:
fileTypes: [{EntityName}FileType],`,
      },
    },
    usageExample: `// Use the file service via the directory to get the upload URL:
const fileServiceUrl = await directory.getServiceUrl(AdspId.parse('urn:ads:platform:file-service'));

// Upload a file (multipart/form-data) using tokenProvider for auth:
const token = await tokenProvider.getAccessToken();
// POST to \`\${fileServiceUrl}/file/v1/files\` with Authorization: Bearer \${token}`,
  },
};

const templateSummarySchema = z.object({
  id: z.string(),
  description: z.string(),
  compatibleWith: z.string(),
});

const templateSchema = z.object({
  id: z.string(),
  description: z.string(),
  compatibleWith: z.string(),
  newFiles: z.record(z.string()).optional(),
  integrationChanges: z.record(
    z.object({
      description: z.string(),
      pattern: z.string(),
    })
  ),
  usageExample: z.string().optional(),
});

export function createListNxAdspTemplatesTool() {
  return createTool({
    id: 'list-nx-adsp-templates',
    description:
      'List available nx-adsp code templates for ADSP service capabilities. ' +
      'Call this before get-nx-adsp-template to discover which templates are available.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      templates: z.array(templateSummarySchema),
    }),
    execute: async () => ({
      templates: Object.values(templates).map(({ id, description, compatibleWith }) => ({
        id,
        description,
        compatibleWith,
      })),
    }),
  });
}

export function createGetNxAdspTemplateTool() {
  return createTool({
    id: 'get-nx-adsp-template',
    description:
      'Get the complete code for an nx-adsp ADSP capability. Returns: ' +
      '"newFiles" (files to create, keyed by path — use write_file if absent, edit_file if present), ' +
      '"integrationChanges" (edits to make to main.ts or store.ts — always use edit_file), ' +
      '"usageExample" (how to use the capability in route handlers or components). ' +
      'Replace {placeholders} with domain values. Do not invent SDK types not shown in the template.',
    inputSchema: z.object({
      templateId: z.string().describe('Template ID from list-nx-adsp-templates.'),
    }),
    outputSchema: z.object({
      template: templateSchema.nullable(),
    }),
    execute: async ({ templateId }) => ({
      template: templates[templateId] ?? null,
    }),
  });
}

export function createNxAdspTemplateTools() {
  return {
    listNxAdspTemplatesTool: createListNxAdspTemplatesTool(),
    getNxAdspTemplateTool: createGetNxAdspTemplateTool(),
  };
}

export type ListNxAdspTemplatesTool = ReturnType<typeof createListNxAdspTemplatesTool>;
export type GetNxAdspTemplateTool = ReturnType<typeof createGetNxAdspTemplateTool>;
