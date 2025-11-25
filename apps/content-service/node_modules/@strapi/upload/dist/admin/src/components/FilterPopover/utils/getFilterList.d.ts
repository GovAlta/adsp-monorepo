interface GetFilterListProps {
    fieldSchema: {
        type: string;
        options?: {
            value: string;
        }[];
        mainField?: {
            schema: {
                type: string;
            };
        };
    };
}
export declare const getFilterList: ({ fieldSchema: { type: fieldType, mainField }, }: GetFilterListProps) => {
    intlLabel: {
        id: string;
        defaultMessage: string;
    };
    value: string;
}[];
export {};
