import type { Core, UID } from '@strapi/types';
export type ControllerFactory = ((params: {
    strapi: Core.Strapi;
}) => Core.Controller) | Core.Controller;
export type ControllerFactoryMap = Record<UID.Controller, ControllerFactory>;
export type ControllerMap = Record<UID.Controller, Core.Controller>;
export type ControllerExtendFn = (service: Core.Controller) => Core.Controller;
declare const controllersRegistry: (strapi: Core.Strapi) => {
    /**
     * Returns this list of registered controllers uids
     */
    keys(): string[];
    /**
     * Returns the instance of a controller. Instantiate the controller if not already done
     */
    get(uid: UID.Controller): Core.Controller | undefined;
    /**
     * Returns a map with all the controller in a namespace
     */
    getAll(namespace: string): {};
    /**
     * Registers a controller
     */
    set(uid: UID.Controller, value: ControllerFactory): any;
    /**
     * Registers a map of controllers for a specific namespace
     */
    add(namespace: string, newControllers: ControllerFactoryMap): any;
    /**
     * Wraps a controller to extend it
     */
    extend(controllerUID: UID.Controller, extendFn: ControllerExtendFn): any;
};
export default controllersRegistry;
//# sourceMappingURL=controllers.d.ts.map