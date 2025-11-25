import type { Core } from '@strapi/types';
declare const _default: {
    sendDidInviteUser: () => Promise<void>;
    sendDidUpdateRolePermissions: () => Promise<void>;
    sendDidChangeInterfaceLanguage: () => Promise<void>;
    sendUpdateProjectInformation: (strapi: Core.Strapi) => Promise<void>;
    startCron: (strapi: Core.Strapi) => void;
};
export default _default;
//# sourceMappingURL=metrics.d.ts.map