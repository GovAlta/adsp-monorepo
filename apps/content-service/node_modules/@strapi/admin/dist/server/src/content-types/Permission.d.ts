/**
 * Lifecycle callbacks for the `Permission` model.
 */
declare const _default: {
    collectionName: string;
    info: {
        name: string;
        description: string;
        singularName: string;
        pluralName: string;
        displayName: string;
    };
    options: {};
    pluginOptions: {
        'content-manager': {
            visible: boolean;
        };
        'content-type-builder': {
            visible: boolean;
        };
    };
    attributes: {
        action: {
            type: string;
            minLength: number;
            configurable: boolean;
            required: boolean;
        };
        actionParameters: {
            type: string;
            configurable: boolean;
            required: boolean;
            default: {};
        };
        subject: {
            type: string;
            minLength: number;
            configurable: boolean;
            required: boolean;
        };
        properties: {
            type: string;
            configurable: boolean;
            required: boolean;
            default: {};
        };
        conditions: {
            type: string;
            configurable: boolean;
            required: boolean;
            default: never[];
        };
        role: {
            configurable: boolean;
            type: string;
            relation: string;
            inversedBy: string;
            target: string;
        };
    };
};
export default _default;
//# sourceMappingURL=Permission.d.ts.map