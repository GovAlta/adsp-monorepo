type Filter = {
    [key in 'mime' | 'createdAt' | 'updatedAt']?: {
        [key in '$contains' | '$notContains' | '$eq' | '$not']?: string[] | string | {
            $contains: string[];
        };
    } | undefined;
};
export interface FilterPopoverProps {
    displayedFilters: {
        name: string;
        metadatas?: {
            label?: string;
        };
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
    }[];
    filters: Filter[];
    onSubmit: (filters: Filter[]) => void;
    onToggle: () => void;
}
export declare const FilterPopover: ({ displayedFilters, filters, onSubmit, onToggle, }: FilterPopoverProps) => import("react/jsx-runtime").JSX.Element;
export {};
