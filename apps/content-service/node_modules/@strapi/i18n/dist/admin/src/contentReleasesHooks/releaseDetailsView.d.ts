import type { Schema } from '@strapi/types';
interface AddLocaleToReleasesHookArgs {
    displayedHeaders: {
        key: string;
        fieldSchema: Schema.Attribute.Kind | 'custom';
        metadatas: {
            label: {
                id: string;
                defaultMessage: string;
            };
            searchable: boolean;
            sortable: boolean;
        };
        name: string;
    }[];
    hasI18nEnabled: boolean;
}
declare const addLocaleToReleasesHook: ({ displayedHeaders }: AddLocaleToReleasesHookArgs) => {
    displayedHeaders: ({
        key: string;
        fieldSchema: Schema.Attribute.Kind | 'custom';
        metadatas: {
            label: {
                id: string;
                defaultMessage: string;
            };
            searchable: boolean;
            sortable: boolean;
        };
        name: string;
    } | {
        label: {
            id: string;
            defaultMessage: string;
        };
        name: string;
    })[];
    hasI18nEnabled: boolean;
};
export { addLocaleToReleasesHook };
