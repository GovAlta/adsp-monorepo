export type Condition = {
    id: string;
    displayName: string;
    name: string;
    plugin?: string;
    category?: string;
    /**
     * The handler of a {@link Condition}
     */
    handler: (user: object, options: object) => object | boolean;
};
/**
 * Set of attributes used to create a new {@link Action} object
 */
export type CreateConditionPayload = Omit<Condition, 'id'>;
/**
 * Get the default value used for every condition
 * @return {Condition}
 */
export declare const getDefaultConditionAttributes: () => {
    category: string;
};
/**
 * Get the list of all the valid attributes of a {@link Condition}
 * @return {string[]}
 */
export declare const conditionFields: readonly ["id", "displayName", "handler", "plugin", "category"];
/**
 * Remove unwanted attributes from a {@link Condition}
 */
export declare const sanitizeConditionAttributes: import("lodash/fp").LodashPick2x1;
export declare const computeConditionId: (condition: CreateConditionPayload) => string;
/**
 * Assign an id attribute to a {@link CreateConditionPayload} object
 * @param  attrs - Payload used to create a condition
 */
export declare const assignConditionId: (attrs: CreateConditionPayload) => Condition;
/**
 * Transform the given attributes into a domain representation of a Condition
 * @param payload - The condition payload containing the attributes needed to create a {@link Condition}
 */
export declare const create: (payload: CreateConditionPayload) => Condition;
declare const _default: {
    assignConditionId: (attrs: CreateConditionPayload) => Condition;
    computeConditionId: (condition: CreateConditionPayload) => string;
    conditionFields: readonly ["id", "displayName", "handler", "plugin", "category"];
    create: (payload: CreateConditionPayload) => Condition;
    getDefaultConditionAttributes: () => {
        category: string;
    };
    sanitizeConditionAttributes: import("lodash/fp").LodashPick2x1;
};
export default _default;
//# sourceMappingURL=index.d.ts.map