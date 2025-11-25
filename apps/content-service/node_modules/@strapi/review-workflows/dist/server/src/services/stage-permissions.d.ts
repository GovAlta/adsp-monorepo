import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    register({ roleId, action, fromStage }: any): Promise<any>;
    registerMany(permissions: any): Promise<any>;
    unregister(permissions: any): Promise<void>;
    can(action: any, fromStage: any): any;
};
export default _default;
//# sourceMappingURL=stage-permissions.d.ts.map