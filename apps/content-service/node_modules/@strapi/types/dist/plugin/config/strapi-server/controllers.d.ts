import type * as Core from '../../../core';
export type Controller = ({ strapi }: {
    strapi: Core.Strapi;
}) => Core.Controller;
export interface Controllers {
    [key: string]: Controller;
}
//# sourceMappingURL=controllers.d.ts.map