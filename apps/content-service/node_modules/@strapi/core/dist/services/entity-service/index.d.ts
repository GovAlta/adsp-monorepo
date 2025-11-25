import type { Database } from '@strapi/database';
import type { Core, Modules } from '@strapi/types';
type Decoratable<T> = T & {
    decorate(decorator: (old: Modules.EntityService.EntityService) => Modules.EntityService.EntityService & {
        [key: string]: unknown;
    }): void;
};
declare const _default: (ctx: {
    strapi: Core.Strapi;
    db: Database;
}) => Decoratable<Modules.EntityService.EntityService>;
export default _default;
//# sourceMappingURL=index.d.ts.map