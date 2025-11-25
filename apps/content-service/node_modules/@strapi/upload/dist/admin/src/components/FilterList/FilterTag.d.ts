import type { FilterStructure } from './FilterList';
type FilterTagAttribute = {
    fieldSchema?: {
        type?: string;
        options?: {
            label: string;
            value: string;
        }[];
    };
    metadatas?: {
        label?: string;
    };
    name: string;
};
interface FilterTagProps {
    attribute: FilterTagAttribute;
    operator: string;
    value: string;
    filter: FilterStructure;
    onClick: (filter: FilterStructure) => void;
}
export declare const FilterTag: ({ attribute, filter, onClick, operator, value }: FilterTagProps) => import("react/jsx-runtime").JSX.Element;
export {};
