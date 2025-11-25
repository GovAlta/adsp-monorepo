import { ListFieldLayout, ListLayout } from '@strapi/content-manager/strapi-admin';
import type { Modules, UID } from '@strapi/types';
interface AddColumnToTableHookArgs {
    layout: ListLayout;
    displayedHeaders: ListFieldLayout[];
}
declare const addColumnToTableHook: ({ displayedHeaders, layout }: AddColumnToTableHookArgs) => {
    displayedHeaders: (ListFieldLayout | {
        searchable: boolean;
        sortable: boolean;
        name: string;
        label: {
            id: string;
            defaultMessage: string;
        };
        cellFormatter: (props: Modules.Documents.AnyDocument, _: any, { model }: {
            model: UID.ContentType;
        }) => import("react/jsx-runtime").JSX.Element;
    })[];
    layout: ListLayout;
};
interface ReleaseListCellProps extends Modules.Documents.AnyDocument {
    documentId: Modules.Documents.ID;
    model: UID.ContentType;
}
declare const ReleaseListCell: ({ documentId, model }: ReleaseListCellProps) => import("react/jsx-runtime").JSX.Element;
export { ReleaseListCell, addColumnToTableHook };
export type { ReleaseListCellProps };
