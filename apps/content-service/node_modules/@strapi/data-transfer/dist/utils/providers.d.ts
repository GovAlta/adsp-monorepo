import type { Core } from '@strapi/types';
export type ValidStrapiAssertion = (strapi: unknown, msg?: string) => asserts strapi is Core.Strapi;
export declare const assertValidStrapi: ValidStrapiAssertion;
//# sourceMappingURL=providers.d.ts.map