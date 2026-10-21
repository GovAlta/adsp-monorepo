export interface AdspComponentSetup {
  type: string;
  // Key in the platform configuration catalog; absent when the service registers no schema.
  schemaKey?: string;
  where: string;
  how: string;
  // Set when the service has no page of its own in the ADSP docs.
  docs?: string;
}

export const docsUrl = (service: string): string => `https://govalta.github.io/adsp-monorepo/services/${service}.html`;

// How each ADSP service is set up in tenant admin. See "Updating the ADSP component map" in the planner README.
export const ADSP_COMPONENT_MAP: Record<string, AdspComponentSetup> = {
  'configuration-service': {
    type: 'Configuration definition',
    where: '/admin/services/configuration',
    how: 'Add a configuration definition with a JSON schema for the values administrators change.',
  },
  'file-service': {
    type: 'File type',
    schemaKey: 'platform:file-service',
    where: '/admin/services/file',
    how: 'Add a file type with read and update roles and a retention policy.',
  },
  'form-service': {
    type: 'Form definition',
    schemaKey: 'form-service',
    where: '/admin/services/form',
    how: 'Add a form definition with applicant and clerk roles, then build the form in the editor.',
  },
  'value-service': {
    type: 'Value definition',
    schemaKey: 'platform:value-service',
    where: '/admin/services/value',
    how: 'Add a value definition with a JSON schema for the values to record.',
  },
  'event-service': {
    type: 'Event definition',
    schemaKey: 'platform:event-service',
    where: '/admin/services/events',
    how: 'Add an event definition with a namespace, name and payload schema.',
  },
  'notification-service': {
    type: 'Notification type',
    schemaKey: 'platform:notification-service',
    where: '/admin/services/notifications',
    how: 'Add a notification type that subscribes to the triggering events, with templates per channel.',
  },
  'comment-service': {
    type: 'Topic type',
    schemaKey: 'platform:comment-service',
    where: '/admin/services/comment',
    how: 'Add a topic type with admin, commenter and reader roles.',
  },
  'task-service': {
    type: 'Task queue',
    schemaKey: 'platform:task-service',
    where: '/admin/services/task',
    how: 'Add a task queue with worker and assigner roles.',
  },
  'calendar-service': {
    type: 'Calendar',
    schemaKey: 'platform:calendar-service',
    where: '/admin/services/calendar',
    how: 'Add a calendar with read and update roles.',
  },
  'pdf-service': {
    type: 'PDF template',
    schemaKey: 'platform:pdf-service',
    where: '/admin/services/pdf',
    how: 'Add a PDF template with a header, footer and body template.',
  },
  'status-service': {
    type: 'Status application',
    schemaKey: 'platform:status-service',
    where: '/admin/services/status',
    how: 'Add an application with a health check endpoint to monitor.',
  },
  'feedback-service': {
    type: 'Feedback site',
    schemaKey: 'platform:feedback-service',
    where: '/admin/services/feedback',
    how: 'Register the site URL that collects feedback.',
  },
  'push-service': {
    type: 'Push stream',
    schemaKey: 'platform:push-service',
    where: '/admin/services/events, Streams tab',
    how: 'Add a stream with the events to push and the subscriber roles.',
  },
  'cache-service': {
    type: 'Cache target',
    schemaKey: 'platform:cache-service',
    where: '/admin/services/cache',
    how: 'Add a cache target for the upstream API with a time to live.',
  },
  'agent-service': {
    type: 'Agent',
    schemaKey: 'platform:agent-service',
    where: '/admin/services/agent',
    how: 'Add an agent with instructions and the tools it may use.',
  },
  'audit-service': {
    type: 'Audit action catalog',
    schemaKey: 'audit-service',
    where: '/admin/services/configuration',
    how: 'Register the actions the app audits as audit-service:actions-<app>, or through serviceConfigurations in the SDK.',
  },
  'directory-service': {
    type: 'Directory entry',
    schemaKey: 'platform:directory-service',
    where: '/admin/services/directory',
    how: 'Add an entry for the app API, and a resource type for any resources it tags.',
  },
  'export-service': {
    type: 'Export source',
    schemaKey: 'platform:export-service',
    where: '/admin/services/configuration',
    how: 'Grant the exporter role to users who export; to let other roles export a source, add it under platform:export-service.',
    docs: docsUrl('services'),
  },
  'pii-service': {
    type: 'PII analyzer access',
    schemaKey: 'platform:pii-service',
    where: 'Keycloak admin console, tenant realm',
    how: 'Grant the backend service account the pii-analyzer role on urn:ads:platform:pii-service.',
  },
  'script-service': {
    type: 'Script',
    schemaKey: 'platform:script-service',
    where: '/admin/services/script',
    how: 'Add a script with the runner roles allowed to execute it.',
    docs: docsUrl('services'),
  },
  'token-handler': {
    type: 'Token handler client',
    schemaKey: 'platform:token-handler',
    where: '/admin/services/access, Token handler tab',
    how: 'Add a client with the upstream targets the frontend calls, then register it.',
  },
  'verify-service': {
    type: 'Verification codes',
    where: 'Keycloak admin console, tenant realm',
    how: 'Grant the backend service account the code-generator and code-verifier roles on urn:ads:platform:verify-service.',
  },
};

// Platform services that no app is built on.
export const EXCLUDED_SERVICES = ['tenant-management-api', 'tenant-service', 'project-planner-service'];
