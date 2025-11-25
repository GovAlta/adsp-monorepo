import type { ListFieldLayout, ListLayout } from '@strapi/content-manager/strapi-admin';
interface AddColumnToTableHookArgs {
    layout: ListLayout;
    displayedHeaders: ListFieldLayout[];
}
declare const addColumnToTableHook: ({ displayedHeaders, layout }: AddColumnToTableHookArgs) => {
    displayedHeaders: (ListFieldLayout | {
        attribute: {
            type: string;
        };
        label: {
            id: string;
            defaultMessage: string;
        };
        searchable: boolean;
        sortable: boolean;
        name: string;
        cellFormatter: (props: any, _header: any, meta: any) => import("react/jsx-runtime").JSX.Element;
    })[];
    layout: ListLayout;
};
export { addColumnToTableHook };
