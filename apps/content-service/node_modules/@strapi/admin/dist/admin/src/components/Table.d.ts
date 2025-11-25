/**
 * TODO: honestly, half of this stuff should come straight from
 * the design-system and then we can just wrap round the bits for
 * the i18n & router interactions.
 *
 * So we'll do that in v2 of the DS.
 */
import * as React from 'react';
import { RawTrProps, EmptyStateLayoutProps, TableProps, RawTdProps } from '@strapi/design-system';
interface BaseRow {
    id: string | number;
    [key: string]: any;
}
interface TableHeader<TData = object, THeader = object> {
    /**
     * Typically used by plugins to render a custom cell
     */
    cellFormatter?: (data: TData, header: Omit<THeader, 'cellFormatter'>) => React.ReactNode;
    label: string;
    name: string;
    searchable?: boolean;
    sortable?: boolean;
}
interface TableContextValue<TRow extends BaseRow, THeader extends TableHeader<TRow, THeader>> extends Pick<TableProps, 'footer'> {
    colCount: number;
    hasHeaderCheckbox: boolean;
    headers: THeader[];
    isLoading: boolean;
    rowCount: number;
    rows: TRow[];
    setHasHeaderCheckbox: (value: boolean) => void;
    selectedRows: TRow[];
    selectRow: (row: TRow | TRow[]) => void;
}
declare const useTable: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: TableContextValue<any, any>) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
interface RootProps<TRow extends BaseRow, THeader extends TableHeader<TRow, THeader>> extends Partial<Pick<TableContextValue<TRow, THeader>, 'footer' | 'headers' | 'isLoading' | 'rows' | 'selectedRows'>> {
    children?: React.ReactNode;
    defaultSelectedRows?: TRow[];
    onSelectedRowsChange?: (selectedRows: TRow[]) => void;
}
/**
 * @alpha we may move this component to the design-system.
 * @public
 * @description A generic table component composition. Internally handles the state of the table
 * such as selected rows, loading state, and more assuming the correct pieces are put togther.
 * @example
 * ```tsx
 * interace Data {
 *  id: string;
 *  name: string;
 *  email: string;
 * }
 *
 * const ListView = () => {
 *  const { data, isLoading } = useGetData<Data>();
 *
 *  const headers: Table.Header<Data>[] = [
 *    {
 *      label: 'Name',
 *      name: 'name',
 *      sortable: true,
 *    },
 *    {
 *      label: 'Email',
 *      name: 'email',
 *      sortable: true,
 *    },
 *  ];
 *
 *  return (
 *    <Table.Root rows={data} headers={headers} isLoading={isLoading}>
 *      <Table.Content>
 *        <Table.Head>
 *          {headers.map((head) => (
 *            <Table.HeaderCell key={head.name} {...head} />
 *          ))}
 *        </Table.Head>
 *        <Table.Body>
 *          <Table.Loading />
 *          <Table.Empty />
 *          {data.map((row) => (
 *            <Table.Row key={row.id}>
 *              <Table.Cell>{row.name}</Table.Cell>
 *              <Table.Cell>{row.email}</Table.Cell>
 *            </Table.Row>
 *          ))}
 *        </Table.Body>
 *      </Table.Content>
 *    </Table.Root>
 *  );
 * };
 * ```
 */
declare const Table: {
    Root: <TRow extends BaseRow, THeader extends TableHeader<TRow, THeader>>({ children, defaultSelectedRows, footer, headers, isLoading, onSelectedRowsChange, rows, selectedRows: selectedRowsProps, }: RootProps<TRow, THeader>) => import("react/jsx-runtime").JSX.Element;
    Content: ({ children }: Table.ContentProps) => import("react/jsx-runtime").JSX.Element;
    ActionBar: ({ children }: Table.ActionBarProps) => import("react/jsx-runtime").JSX.Element | null;
    Head: ({ children }: Table.HeadProps) => import("react/jsx-runtime").JSX.Element;
    HeaderCell: <TData, THead>({ name, label, sortable }: TableHeader<TData, THead>) => import("react/jsx-runtime").JSX.Element;
    HeaderCheckboxCell: () => import("react/jsx-runtime").JSX.Element;
    Body: ({ children }: Table.BodyProps) => import("react/jsx-runtime").JSX.Element | null;
    CheckboxCell: ({ id, ...props }: Table.CheckboxCellProps) => import("react/jsx-runtime").JSX.Element;
    Cell: (props: Table.CellProps) => import("react/jsx-runtime").JSX.Element;
    Row: (props: Table.RowProps) => import("react/jsx-runtime").JSX.Element;
    Loading: ({ children }: Table.LoadingProps) => import("react/jsx-runtime").JSX.Element | null;
    Empty: (props: Table.EmptyProps) => import("react/jsx-runtime").JSX.Element | null;
};
declare namespace Table {
    type Props<TData extends BaseRow, THeader extends TableHeader<TData, THeader> = TableHeader<TData, TableHeader>> = RootProps<TData, THeader>;
    interface ActionBarProps {
        children?: React.ReactNode;
    }
    interface ContentProps {
        children: React.ReactNode;
    }
    type Header<TData, THeader> = TableHeader<TData, THeader>;
    interface HeadProps {
        children: React.ReactNode;
    }
    interface EmptyProps extends Partial<EmptyStateLayoutProps> {
    }
    interface LoadingProps {
        children?: React.ReactNode;
    }
    interface BodyProps {
        children: React.ReactNode;
    }
    interface RowProps extends RawTrProps {
    }
    interface CellProps extends RawTdProps {
    }
    interface CheckboxCellProps extends Pick<BaseRow, 'id'>, Omit<RawTdProps, 'id'> {
    }
}
export { Table, useTable };
