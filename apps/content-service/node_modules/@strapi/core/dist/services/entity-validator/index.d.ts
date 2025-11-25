/**
 * Entity validator
 * Module that will validate input data for entity creation or edition
 */
import type { Modules, Struct, Schema } from '@strapi/types';
export type ComponentContext = {
    parentContent: {
        model: Struct.Schema;
        id?: number;
        options?: ValidatorContext;
    };
    pathToComponent: string[];
    repeatableData: Modules.EntityValidator.Entity[];
    fullDynamicZoneContent?: Schema.Attribute.Value<Schema.Attribute.DynamicZone>;
};
interface ValidatorContext {
    isDraft?: boolean;
    locale?: string | null;
}
declare const entityValidator: Modules.EntityValidator.EntityValidator;
export default entityValidator;
//# sourceMappingURL=index.d.ts.map