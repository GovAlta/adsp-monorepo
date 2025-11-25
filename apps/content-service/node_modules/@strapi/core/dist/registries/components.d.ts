import type { Struct, UID } from '@strapi/types';
declare const componentsRegistry: () => {
    /**
     * Returns this list of registered components uids
     */
    keys(): UID.Component[];
    /**
     * Returns the instance of a component. Instantiate the component if not already done
     */
    get(uid: UID.Component): Struct.ComponentSchema;
    /**
     * Returns a map with all the components in a namespace
     */
    getAll(): Record<`${string}.${string}`, Struct.ComponentSchema>;
    /**
     * Registers a component
     */
    set(uid: UID.Component, component: Struct.ComponentSchema): any;
    /**
     * Registers a map of components for a specific namespace
     */
    add(newComponents: Record<UID.Component, Struct.ComponentSchema>): void;
};
export default componentsRegistry;
//# sourceMappingURL=components.d.ts.map