/**
 * The features service is responsible for managing features within strapi,
 * including interacting with the feature configuration file to know
 * which are enabled and disabled.
 */
import type { Core, Modules } from '@strapi/types';
declare const createFeaturesService: (strapi: Core.Strapi) => Modules.Features.FeaturesService;
export { createFeaturesService };
export type FeaturesService = Modules.Features.FeaturesService;
//# sourceMappingURL=features.d.ts.map