type NumberKeyedObject = Record<number, string>;
type StringFilter = {
    [key: string]: string;
};
type MimeFilter = {
    [key: string]: string | NumberKeyedObject | Record<string, string | NumberKeyedObject> | undefined;
};
export type FilterStructure = {
    [key: string]: MimeFilter | StringFilter | undefined;
};
export interface FilterListProps {
    appliedFilters: FilterStructure[];
    filtersSchema: {
        name: string;
        metadatas?: {
            label?: string;
        };
        fieldSchema?: {
            type?: string;
            mainField?: {
                name: string;
                type: string;
            };
            options?: {
                label: string;
                value: string;
            }[];
        };
    }[];
    onRemoveFilter: (filters: FilterStructure[]) => void;
}
export declare const FilterList: ({ appliedFilters, filtersSchema, onRemoveFilter }: FilterListProps) => (import("react/jsx-runtime").JSX.Element | null)[];
export {};
