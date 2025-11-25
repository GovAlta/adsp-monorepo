type SectionTitle = {
    id: string;
    defaultMessage: string;
};
type Item = {
    intlLabel: {
        id: string;
        defaultMessage: string;
    };
    description?: {
        id: string;
        defaultMessage: string;
    };
    name: string;
    type: string;
    value?: string;
    options?: {
        key: string;
        value: string;
        metadatas: {
            intlLabel: {
                id: string;
                defaultMessage: string;
            };
        };
    }[];
};
type FormTypeOption = {
    sectionTitle: SectionTitle | null;
    items: Item[];
};
export type FormTypeOptions = Array<FormTypeOption>;
/**
 * @description
 * Adds form options to the default section or as a new section
 */
export declare const addItemsToFormSection: (formTypeOptions: FormTypeOptions | Item[], sections: FormTypeOptions) => void;
export {};
