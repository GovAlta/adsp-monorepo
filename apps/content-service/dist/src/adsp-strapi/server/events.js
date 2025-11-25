"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRegistered = exports.UserRegisteredEventDefinition = void 0;
exports.UserRegisteredEventDefinition = {
    name: 'user-registered',
    description: 'Signalled when a user is registered for access to the content manager.',
    payloadSchema: {
        type: 'object',
        properties: {
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            registrationUrl: { type: 'string' },
            isEditor: { type: 'boolean' },
        },
    },
};
const userRegistered = (tenantId, { email, firstName, lastName, registrationUrl, isEditor }) => ({
    tenantId,
    name: exports.UserRegisteredEventDefinition.name,
    timestamp: new Date(),
    payload: {
        email,
        firstName,
        lastName,
        registrationUrl,
        isEditor,
    },
});
exports.userRegistered = userRegistered;
//# sourceMappingURL=events.js.map