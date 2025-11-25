import type { Core, UID, Utils } from '@strapi/types';
import { CoreContentTypeRouteValidator } from './core-api/routes/validation';
type WithStrapiCallback<T> = T | (<S extends {
    strapi: Core.Strapi;
}>(params: S) => T);
declare const createCoreController: <TUID extends UID.ContentType, TController extends Core.CoreAPI.Controller.Extendable<TUID>>(uid: TUID, cfg?: WithStrapiCallback<Utils.PartialWithThis<Core.CoreAPI.Controller.Extendable<TUID> & TController>>) => ({ strapi, }: {
    strapi: Core.Strapi;
}) => TController & Core.CoreAPI.Controller.ContentType<TUID>;
declare function createCoreService<TUID extends UID.ContentType, TService extends Core.CoreAPI.Service.Extendable<TUID>>(uid: TUID, cfg?: WithStrapiCallback<Utils.PartialWithThis<Core.CoreAPI.Service.Extendable<TUID> & TService>>): ({ strapi, }: {
    strapi: Core.Strapi;
}) => TService & Core.CoreAPI.Service.ContentType<TUID>;
declare function createCoreRouter<T extends UID.ContentType>(uid: T, cfg?: Core.CoreAPI.Router.RouterConfig<T>): Core.CoreAPI.Router.Router;
declare const createCoreValidator: <T extends UID.ContentType>(uid: T, strapi: Core.Strapi) => CoreContentTypeRouteValidator;
declare const isCustomController: <T extends Core.Controller>(controller: T) => boolean;
export { createCoreController, createCoreService, createCoreRouter, createCoreValidator, isCustomController, };
//# sourceMappingURL=factories.d.ts.map