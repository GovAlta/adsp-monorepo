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
        type: {
            type: string;
            enum: string[];
            required: boolean;
        };
        contentType: {
            type: string;
            required: boolean;
        };
        entryDocumentId: {
            type: string;
        };
        locale: {
            type: string;
        };
        release: {
            type: string;
            relation: string;
            target: string;
            inversedBy: string;
        };
        isEntryValid: {
            type: string;
        };
    };
};
export default _default;
//# sourceMappingURL=schema.d.ts.map