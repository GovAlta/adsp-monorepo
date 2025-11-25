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
export type Filter = {
    [key in 'mime' | 'createdAt' | 'updatedAt']?: {
        [key in '$contains' | '$notContains' | '$eq' | '$not']?: string[] | string | {
            $contains: string[];
        };
    } | undefined;
};
interface FiltersProps {
    appliedFilters: FilterStructure[];
    onChangeFilters: (filters: Filter[]) => void;
}
export declare const Filters: ({ appliedFilters, onChangeFilters }: FiltersProps) => import("react/jsx-runtime").JSX.Element;
export {};
