"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    'adsp-strapi': {
        enabled: true,
        resolve: './src/adsp-strapi',
        config: {
            serviceId: 'urn:ads:platform:content-service',
            displayName: 'Content service',
            description: 'Content service provides a headless CMS.',
        },
    },
    'users-permissions': { enabled: false },
    'cloud': { enabled: false },
});
//# sourceMappingURL=plugins.js.map