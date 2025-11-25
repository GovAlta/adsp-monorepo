"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    type: 'admin',
    routes: [
        {
            method: 'POST',
            path: '/user',
            handler: 'user.create',
            config: {
                policies: ['plugin::adsp-strapi.isAdminUser'],
            },
        },
    ],
};
//# sourceMappingURL=admin.js.map