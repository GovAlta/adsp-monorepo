import { Document } from '../../../hooks/useDocument';
import type { DocumentActionComponent } from '../../../content-manager';
interface TableActionsProps {
    document: Document;
}
declare const TableActions: ({ document }: TableActionsProps) => import("react/jsx-runtime").JSX.Element;
declare const DEFAULT_TABLE_ROW_ACTIONS: DocumentActionComponent[];
export { TableActions, DEFAULT_TABLE_ROW_ACTIONS };
