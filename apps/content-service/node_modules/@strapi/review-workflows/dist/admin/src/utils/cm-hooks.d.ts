import type { ListFieldLayout, ListLayout } from '@strapi/content-manager/strapi-admin';
interface AddColumnToTableHookArgs {
    layout: ListLayout;
    displayedHeaders: ListFieldLayout[];
}
declare const addColumnToTableHook: ({ displayedHeaders, layout }: AddColumnToTableHookArgs) => {
    displayedHeaders: (ListFieldLayout | {
        name: string;
        attribute: {
            type: "relation";
            relation: "oneToMany";
            target: "admin::review-workflow-stage";
        };
        label: {
            id: string;
            defaultMessage: string;
        };
        searchable: false;
        sortable: true;
        mainField: {
            name: string;
            type: "string";
        };
        cellFormatter: (props: import("@strapi/types/dist/modules/documents").AnyDocument) => import("react/jsx-runtime").JSX.Element;
    } | {
        name: string;
        attribute: {
            type: "relation";
            target: "admin::user";
            relation: "oneToMany";
        };
        label: {
            id: string;
            defaultMessage: string;
        };
        searchable: false;
        sortable: true;
        mainField: {
            name: string;
            type: "string";
        };
        cellFormatter: (props: import("@strapi/types/dist/modules/documents").AnyDocument) => import("react/jsx-runtime").JSX.Element;
    })[];
    layout: ListLayout;
};
export { addColumnToTableHook };
