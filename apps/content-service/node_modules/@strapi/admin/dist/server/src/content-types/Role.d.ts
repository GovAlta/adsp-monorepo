/**
 * Lifecycle callbacks for the `Role` model.
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
        name: {
            type: string;
            minLength: number;
            unique: boolean;
            configurable: boolean;
            required: boolean;
        };
        code: {
            type: string;
            minLength: number;
            unique: boolean;
            configurable: boolean;
            required: boolean;
        };
        description: {
            type: string;
            configurable: boolean;
        };
        users: {
            configurable: boolean;
            type: string;
            relation: string;
            mappedBy: string;
            target: string;
        };
        permissions: {
            configurable: boolean;
            type: string;
            relation: string;
            mappedBy: string;
            target: string;
        };
    };
};
export default _default;
//# sourceMappingURL=Role.d.ts.map