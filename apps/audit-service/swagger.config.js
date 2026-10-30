module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Audit service',
    version: '0.0.0',
    description: `The Audit service records who did what, to which resource and when, for ADSP applications.

**Read this before integrating.**
- A \`202\` from \`POST /audit/v1/{namespace}/events\` does **not** mean every event was stored. Inspect \`accepted\`, \`duplicates\` and \`rejected\` in the body. Rejected events are not stored and are not resent.
- \`403\` means a missing role **or** a namespace that is not the caller's. \`404\` on the actions endpoint means no catalog is registered for the namespace. \`503\` means retry.
- Roles: \`audit-writer\` writes events, \`audit-reader\` reads events and action catalogs, \`audit-admin\` manages failed events.
- Retention periods are applied when an event is written. Changing retention configuration affects only events written afterward.

Use **Authorize** with a bearer token to try requests from this page. Writing to a namespace you do not own returns \`403\`.`,
  },
  tags: [
    { name: 'Audit events', description: 'Write and read audit events. Requires audit-writer to write and audit-reader to read.' },
    { name: 'Action catalogs', description: 'Read the registered action definitions for a namespace. Requires audit-reader.' },
    { name: 'Failed audit events', description: 'List and replay events parked after a storage failure. Requires audit-admin.' },
  ],
  components: {
    securitySchemes: {
      accessToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ accessToken: [] }],
};
