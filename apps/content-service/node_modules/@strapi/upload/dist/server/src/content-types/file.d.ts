declare const _default: {
    schema: {
        collectionName: string;
        info: {
            singularName: string;
            pluralName: string;
            displayName: string;
            description: string;
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
                type: "string";
                configurable: false;
                required: true;
            };
            alternativeText: {
                type: "string";
                configurable: false;
            };
            caption: {
                type: "string";
                configurable: false;
            };
            width: {
                type: "integer";
                configurable: false;
            };
            height: {
                type: "integer";
                configurable: false;
            };
            formats: {
                type: "json";
                configurable: false;
            };
            hash: {
                type: "string";
                configurable: false;
                required: true;
            };
            ext: {
                type: "string";
                configurable: false;
            };
            mime: {
                type: "string";
                configurable: false;
                required: true;
            };
            size: {
                type: "decimal";
                configurable: false;
                required: true;
            };
            url: {
                type: "string";
                configurable: false;
                required: true;
            };
            previewUrl: {
                type: "string";
                configurable: false;
            };
            provider: {
                type: "string";
                configurable: false;
                required: true;
            };
            provider_metadata: {
                type: "json";
                configurable: false;
            };
            related: {
                type: "relation";
                relation: "morphToMany";
                configurable: false;
            };
            folder: {
                type: "relation";
                relation: "manyToOne";
                target: "plugin::upload.folder";
                inversedBy: string;
                private: true;
            };
            folderPath: {
                type: "string";
                minLength: number;
                required: true;
                private: true;
                searchable: false;
            };
        };
        indexes: {
            name: string;
            columns: string[];
            type: null;
        }[];
    };
};
export default _default;
//# sourceMappingURL=file.d.ts.map