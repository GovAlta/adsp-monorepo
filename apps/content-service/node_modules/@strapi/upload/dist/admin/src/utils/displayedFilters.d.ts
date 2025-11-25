export declare const displayedFilters: ({
    name: string;
    fieldSchema: {
        type: string;
        options?: undefined;
    };
    metadatas: {
        label: string;
    };
} | {
    name: string;
    fieldSchema: {
        type: string;
        options: {
            label: string;
            value: string;
        }[];
    };
    metadatas: {
        label: string;
    };
})[];
