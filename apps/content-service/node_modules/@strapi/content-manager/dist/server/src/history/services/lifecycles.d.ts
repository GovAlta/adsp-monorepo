import type { Core } from '@strapi/types';
declare const createLifecyclesService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    bootstrap(): Promise<void>;
    destroy(): Promise<void>;
};
export { createLifecyclesService };
//# sourceMappingURL=lifecycles.d.ts.map