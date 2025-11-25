export declare const contentTypes: {
    release: {
        schema: {
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
    };
    'release-action': {
        schema: {
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
    };
};
//# sourceMappingURL=index.d.ts.map