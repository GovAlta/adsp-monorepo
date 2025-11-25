declare const _default: {
    collectionName: string;
    info: {
        singularName: string;
        pluralName: string;
        displayName: string;
    };
    options: {
        draftAndPublish: boolean;
    };
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
            required: boolean;
        };
        releasedAt: {
            type: string;
        };
        scheduledAt: {
            type: string;
        };
        timezone: {
            type: string;
        };
        status: {
            type: string;
            enum: string[];
            required: boolean;
        };
        actions: {
            type: string;
            relation: string;
            target: string;
            mappedBy: string;
        };
    };
};
export default _default;
//# sourceMappingURL=schema.d.ts.map