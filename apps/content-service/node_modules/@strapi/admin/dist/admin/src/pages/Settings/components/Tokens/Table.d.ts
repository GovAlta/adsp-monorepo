import { ApiToken } from '../../../../../../shared/contracts/api-token';
import { SanitizedTransferToken } from '../../../../../../shared/contracts/transfer';
import { Table as TableImpl } from '../../../../components/Table';
import type { Data } from '@strapi/types';
interface TableProps extends Pick<TableImpl.Props<SanitizedTransferToken | ApiToken>, 'headers' | 'isLoading'> {
    onConfirmDelete: (id: Data.ID) => void;
    permissions: {
        canRead: boolean;
        canDelete: boolean;
        canUpdate: boolean;
    };
    tokens: SanitizedTransferToken[] | ApiToken[];
    tokenType: 'api-token' | 'transfer-token';
}
declare const Table: ({ permissions, headers, isLoading, tokens, onConfirmDelete, tokenType, }: TableProps) => import("react/jsx-runtime").JSX.Element;
export { Table };
export type { TableProps };
