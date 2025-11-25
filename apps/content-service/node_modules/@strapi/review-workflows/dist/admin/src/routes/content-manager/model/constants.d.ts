import type { Filters } from '@strapi/admin/strapi-admin';
export declare const REVIEW_WORKFLOW_COLUMNS: ({
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
export declare const REVIEW_WORKFLOW_FILTERS: ({
    mainField: {
        name: string;
        type: "string";
    };
    input: (props: Filters.ValueInputProps) => import("react/jsx-runtime").JSX.Element;
    label: {
        id: string;
        defaultMessage: string;
    };
    name: string;
    type: "relation";
    operators?: undefined;
} | {
    type: "relation";
    mainField: {
        name: string;
        type: "integer";
    };
    input: ({ name }: Filters.ValueInputProps) => import("react/jsx-runtime").JSX.Element;
    operators: {
        label: {
            id: string;
            defaultMessage: string;
        };
        value: string;
    }[];
    label: {
        id: string;
        defaultMessage: string;
    };
    name: string;
})[];
