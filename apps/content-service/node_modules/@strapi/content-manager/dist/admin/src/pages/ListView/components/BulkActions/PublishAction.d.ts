import { ConfirmDialogPublishAllProps } from './ConfirmBulkActionDialog';
import type { BulkActionComponent } from '../../../../content-manager';
import type { Document } from '../../../../hooks/useDocument';
interface TableRow extends Document {
}
interface SelectedEntriesModalContentProps {
    listViewSelectedEntries: TableRow[];
    toggleModal: ConfirmDialogPublishAllProps['onToggleDialog'];
    setListViewSelectedDocuments: (documents: TableRow[]) => void;
    model: string;
}
declare const SelectedEntriesModalContent: ({ listViewSelectedEntries, toggleModal, setListViewSelectedDocuments, model, }: SelectedEntriesModalContentProps) => import("react/jsx-runtime").JSX.Element;
declare const PublishAction: BulkActionComponent;
export { PublishAction, SelectedEntriesModalContent };
