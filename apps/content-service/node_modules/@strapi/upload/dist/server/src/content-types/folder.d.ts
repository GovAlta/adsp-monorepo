declare const _default: {
    schema: {
        collectionName: string;
        info: {
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
                type: "string";
                minLength: number;
                required: true;
            };
            pathId: {
                type: "integer";
                unique: true;
                required: true;
            };
            parent: {
                type: "relation";
                relation: "manyToOne";
                target: "plugin::upload.folder";
                inversedBy: string;
            };
            children: {
                type: "relation";
                relation: "oneToMany";
                target: "plugin::upload.folder";
                mappedBy: string;
            };
            files: {
                type: "relation";
                relation: "oneToMany";
                target: "plugin::upload.file";
                mappedBy: string;
            };
            path: {
                type: "string";
                minLength: number;
                required: true;
            };
        };
        indexes: {
            name: string;
            columns: string[];
            type: string;
        }[];
    };
};
export default _default;
//# sourceMappingURL=folder.d.ts.map