import { type DocumentActionPosition, type DocumentActionDescription } from './pages/EditView/components/DocumentActions';
import { type HeaderActionDescription } from './pages/EditView/components/Header';
import { type PanelDescription } from './pages/EditView/components/Panels';
import { type BulkActionDescription } from './pages/ListView/components/BulkActions/Actions';
import type { Document } from './hooks/useDocument';
import type { DocumentMetadata } from '../../shared/contracts/collection-types';
import type { DescriptionComponent } from '@strapi/admin/strapi-admin';
type DescriptionReducer<Config extends object> = (prev: Config[]) => Config[];
interface EditViewContext {
    /**
     * This will ONLY be null, if the content-type
     * does not have draft & published enabled.
     */
    activeTab: 'draft' | 'published' | null;
    /**
     * Will be either 'single-types' | 'collection-types'
     */
    collectionType: string;
    /**
     * this will be undefined if someone is creating an entry.
     */
    document?: Document;
    /**
     * this will be undefined if someone is creating an entry.
     */
    documentId?: string;
    /**
     * this will be undefined if someone is creating an entry.
     */
    meta?: DocumentMetadata;
    /**
     * The current content-type's model.
     */
    model: string;
}
interface ListViewContext {
    /**
     * Will be either 'single-types' | 'collection-types'
     */
    collectionType: string;
    /**
     * The current selected documents in the table
     */
    documents: Document[];
    /**
     * The current content-type's model.
     */
    model: string;
}
interface PanelComponentProps extends EditViewContext {
}
interface PanelComponent extends DescriptionComponent<PanelComponentProps, PanelDescription> {
    /**
     * The defaults are added by Strapi only, if you're providing your own component,
     * you do not need to provide this.
     */
    type?: 'actions' | 'releases';
}
interface DocumentActionProps extends EditViewContext {
}
interface DocumentActionComponent extends DescriptionComponent<DocumentActionProps, DocumentActionDescription> {
    type?: 'clone' | 'configure-the-view' | 'delete' | 'discard' | 'edit' | 'edit-the-model' | 'history' | 'publish' | 'unpublish' | 'update';
    position?: DocumentActionDescription['position'];
}
interface HeaderActionProps extends EditViewContext {
}
interface HeaderActionComponent extends DescriptionComponent<HeaderActionProps, HeaderActionDescription> {
}
interface BulkActionComponentProps extends ListViewContext {
}
interface BulkActionComponent extends DescriptionComponent<BulkActionComponentProps, BulkActionDescription> {
    type?: 'delete' | 'publish' | 'unpublish';
}
declare class ContentManagerPlugin {
    /**
     * The following properties are the stored ones provided by any plugins registering with
     * the content-manager. The function calls however, need to be called at runtime in the
     * application, so instead we collate them and run them later with the complete list incl.
     * ones already registered & the context of the view.
     */
    bulkActions: BulkActionComponent[];
    documentActions: DocumentActionComponent[];
    editViewSidePanels: PanelComponent[];
    headerActions: HeaderActionComponent[];
    constructor();
    addEditViewSidePanel(panels: DescriptionReducer<PanelComponent>): void;
    addEditViewSidePanel(panels: PanelComponent[]): void;
    addDocumentAction(actions: DescriptionReducer<DocumentActionComponent>): void;
    addDocumentAction(actions: DocumentActionComponent[]): void;
    addDocumentHeaderAction(actions: DescriptionReducer<HeaderActionComponent>): void;
    addDocumentHeaderAction(actions: HeaderActionComponent[]): void;
    addBulkAction(actions: DescriptionReducer<BulkActionComponent>): void;
    addBulkAction(actions: BulkActionComponent[]): void;
    get config(): {
        id: string;
        name: string;
        injectionZones: {
            editView: {
                informations: never[];
                'right-links': never[];
            };
            listView: {
                actions: never[];
                deleteModalAdditionalInfos: never[];
                publishModalAdditionalInfos: never[];
                unpublishModalAdditionalInfos: never[];
            };
            preview: {
                actions: never[];
            };
        };
        apis: {
            addBulkAction: {
                (actions: DescriptionReducer<BulkActionComponent>): void;
                (actions: BulkActionComponent[]): void;
            };
            addDocumentAction: {
                (actions: DescriptionReducer<DocumentActionComponent>): void;
                (actions: DocumentActionComponent[]): void;
            };
            addDocumentHeaderAction: {
                (actions: DescriptionReducer<HeaderActionComponent>): void;
                (actions: HeaderActionComponent[]): void;
            };
            addEditViewSidePanel: {
                (panels: DescriptionReducer<PanelComponent>): void;
                (panels: PanelComponent[]): void;
            };
            getBulkActions: () => BulkActionComponent[];
            getDocumentActions: (position?: DocumentActionPosition) => DocumentActionComponent[];
            getEditViewSidePanels: () => PanelComponent[];
            getHeaderActions: () => HeaderActionComponent[];
        };
    };
}
export { ContentManagerPlugin };
export type { EditViewContext, ListViewContext, BulkActionComponent, BulkActionComponentProps, BulkActionDescription, DescriptionComponent, DescriptionReducer, PanelComponentProps, PanelComponent, PanelDescription, DocumentActionComponent, DocumentActionDescription, DocumentActionProps, HeaderActionComponent, HeaderActionDescription, HeaderActionProps, };
