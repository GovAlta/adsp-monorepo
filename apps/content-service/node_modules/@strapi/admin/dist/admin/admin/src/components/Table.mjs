import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Table as Table$1, Thead, Tr, Th, IconButton, Tooltip, Typography, Flex, Checkbox, Tbody, Td, EmptyStateLayout, Loader } from '@strapi/design-system';
import { CaretDown } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useControllableState } from '../hooks/useControllableState.mjs';
import { useQueryParams } from '../hooks/useQueryParams.mjs';
import { createContext } from './Context.mjs';

const [TableProvider, useTable] = createContext('Table');
const Root = ({ children, defaultSelectedRows, footer, headers = [], isLoading = false, onSelectedRowsChange, rows = [], selectedRows: selectedRowsProps })=>{
    const [selectedRows = [], setSelectedRows] = useControllableState({
        prop: selectedRowsProps,
        defaultProp: defaultSelectedRows,
        onChange: onSelectedRowsChange
    });
    const [hasHeaderCheckbox, setHasHeaderCheckbox] = React.useState(false);
    const rowCount = rows.length + 1;
    const colCount = hasHeaderCheckbox ? headers.length + 1 : headers.length;
    const selectRow = (row)=>{
        if (Array.isArray(row)) {
            setSelectedRows(row);
        } else {
            setSelectedRows((prev = [])=>{
                const currentRowIndex = prev.findIndex((r)=>r.id === row.id);
                if (currentRowIndex > -1) {
                    return prev.toSpliced(currentRowIndex, 1);
                }
                return [
                    ...prev,
                    row
                ];
            });
        }
    };
    return /*#__PURE__*/ jsx(TableProvider, {
        colCount: colCount,
        hasHeaderCheckbox: hasHeaderCheckbox,
        setHasHeaderCheckbox: setHasHeaderCheckbox,
        footer: footer,
        headers: headers,
        isLoading: isLoading,
        rowCount: rowCount,
        rows: rows,
        selectedRows: selectedRows,
        selectRow: selectRow,
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/ const Content = ({ children })=>{
    const rowCount = useTable('Content', (state)=>state.rowCount);
    const colCount = useTable('Content', (state)=>state.colCount);
    const footer = useTable('Content', (state)=>state.footer);
    return /*#__PURE__*/ jsx(Table$1, {
        rowCount: rowCount,
        colCount: colCount,
        footer: footer,
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Head
 * -----------------------------------------------------------------------------------------------*/ const Head = ({ children })=>{
    return /*#__PURE__*/ jsx(Thead, {
        children: /*#__PURE__*/ jsx(Tr, {
            children: children
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * HeaderCell
 * -----------------------------------------------------------------------------------------------*/ /**
 * @description A header cell in your table, internally will set the query params for sorting to
 * be passed to your data-fetching function.
 */ const HeaderCell = ({ name, label, sortable })=>{
    const [{ query }, setQuery] = useQueryParams();
    const sort = query?.sort ?? '';
    const [sortBy, sortOrder] = sort.split(':');
    const { formatMessage } = useIntl();
    const isSorted = sortBy === name;
    const sortLabel = formatMessage({
        id: 'components.TableHeader.sort',
        defaultMessage: 'Sort on {label}'
    }, {
        label
    });
    const handleClickSort = ()=>{
        if (sortable) {
            setQuery({
                sort: `${name}:${isSorted && sortOrder === 'ASC' ? 'DESC' : 'ASC'}`
            });
        }
    };
    return /*#__PURE__*/ jsx(Th, {
        action: isSorted && sortable && /*#__PURE__*/ jsx(IconButton, {
            label: sortLabel,
            onClick: handleClickSort,
            variant: "ghost",
            children: /*#__PURE__*/ jsx(SortIcon, {
                $isUp: sortOrder === 'ASC'
            })
        }),
        children: /*#__PURE__*/ jsx(Tooltip, {
            label: sortable ? sortLabel : label,
            children: /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                tag: !isSorted && sortable ? 'button' : 'span',
                onClick: handleClickSort,
                variant: "sigma",
                children: label
            })
        })
    });
};
const SortIcon = styled(CaretDown)`
  transform: ${({ $isUp })=>`rotate(${$isUp ? '180' : '0'}deg)`};
`;
/* -------------------------------------------------------------------------------------------------
 * ActionBar
 * -----------------------------------------------------------------------------------------------*/ const ActionBar = ({ children })=>{
    const { formatMessage } = useIntl();
    const selectedRows = useTable('ActionBar', (state)=>state.selectedRows);
    if (selectedRows.length === 0) return null;
    return /*#__PURE__*/ jsxs(Flex, {
        gap: 2,
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "omega",
                textColor: "neutral500",
                children: formatMessage({
                    id: 'content-manager.components.TableDelete.label',
                    defaultMessage: '{number, plural, one {# row} other {# rows}} selected'
                }, {
                    number: selectedRows.length
                })
            }),
            children
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * HeaderCheckboxCell
 * -----------------------------------------------------------------------------------------------*/ const HeaderCheckboxCell = ()=>{
    const rows = useTable('HeaderCheckboxCell', (state)=>state.rows);
    const selectedRows = useTable('HeaderCheckboxCell', (state)=>state.selectedRows);
    const selectRow = useTable('HeaderCheckboxCell', (state)=>state.selectRow);
    const setHasHeaderCheckbox = useTable('HeaderCheckboxCell', (state)=>state.setHasHeaderCheckbox);
    const { formatMessage } = useIntl();
    const areAllEntriesSelected = selectedRows.length === rows.length && rows.length > 0;
    const isIndeterminate = !areAllEntriesSelected && selectedRows.length > 0;
    React.useEffect(()=>{
        setHasHeaderCheckbox(true);
        return ()=>setHasHeaderCheckbox(false);
    }, [
        setHasHeaderCheckbox
    ]);
    const handleSelectAll = ()=>{
        if (!areAllEntriesSelected) {
            selectRow(rows);
        } else {
            selectRow([]);
        }
    };
    return /*#__PURE__*/ jsx(Th, {
        children: /*#__PURE__*/ jsx(Checkbox, {
            "aria-label": formatMessage({
                id: 'global.select-all-entries',
                defaultMessage: 'Select all entries'
            }),
            disabled: rows.length === 0,
            checked: isIndeterminate ? 'indeterminate' : areAllEntriesSelected,
            onCheckedChange: handleSelectAll
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Empty
 * -----------------------------------------------------------------------------------------------*/ const Empty = (props)=>{
    const { formatMessage } = useIntl();
    const rows = useTable('Empty', (state)=>state.rows);
    const isLoading = useTable('Empty', (state)=>state.isLoading);
    const colCount = useTable('Empty', (state)=>state.colCount);
    /**
   * If we're loading or we have some data, we don't show the empty state.
   */ if (rows.length > 0 || isLoading) {
        return null;
    }
    return /*#__PURE__*/ jsx(Tbody, {
        children: /*#__PURE__*/ jsx(Tr, {
            children: /*#__PURE__*/ jsx(Td, {
                colSpan: colCount,
                children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                    content: formatMessage({
                        id: 'app.components.EmptyStateLayout.content-document',
                        defaultMessage: 'No content found'
                    }),
                    hasRadius: true,
                    icon: /*#__PURE__*/ jsx(EmptyDocuments, {
                        width: "16rem"
                    }),
                    ...props
                })
            })
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * LoadingBody
 * -----------------------------------------------------------------------------------------------*/ const Loading = ({ children = 'Loading content' })=>{
    const isLoading = useTable('Loading', (state)=>state.isLoading);
    const colCount = useTable('Loading', (state)=>state.colCount);
    if (!isLoading) {
        return null;
    }
    return /*#__PURE__*/ jsx(Tbody, {
        children: /*#__PURE__*/ jsx(Tr, {
            children: /*#__PURE__*/ jsx(Td, {
                colSpan: colCount,
                children: /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    padding: 11,
                    background: "neutral0",
                    children: /*#__PURE__*/ jsx(Loader, {
                        children: children
                    })
                })
            })
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Body
 * -----------------------------------------------------------------------------------------------*/ const Body = ({ children })=>{
    const isLoading = useTable('Body', (state)=>state.isLoading);
    const rows = useTable('Body', (state)=>state.rows);
    if (isLoading || rows.length === 0) {
        return null;
    }
    return /*#__PURE__*/ jsx(Tbody, {
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Row
 * -----------------------------------------------------------------------------------------------*/ const Row = (props)=>{
    return /*#__PURE__*/ jsx(Tr, {
        ...props
    });
};
/* -------------------------------------------------------------------------------------------------
 * Cell
 * -----------------------------------------------------------------------------------------------*/ const Cell = (props)=>{
    return /*#__PURE__*/ jsx(Td, {
        ...props
    });
};
/* -------------------------------------------------------------------------------------------------
 * Row
 * -----------------------------------------------------------------------------------------------*/ const CheckboxCell = ({ id, ...props })=>{
    const rows = useTable('CheckboxCell', (state)=>state.rows);
    const selectedRows = useTable('CheckboxCell', (state)=>state.selectedRows);
    const selectRow = useTable('CheckboxCell', (state)=>state.selectRow);
    const { formatMessage } = useIntl();
    const handleSelectRow = ()=>{
        selectRow(rows.find((row)=>row.id === id));
    };
    const isChecked = selectedRows.findIndex((row)=>row.id === id) > -1;
    return /*#__PURE__*/ jsx(Cell, {
        ...props,
        onClick: (e)=>e.stopPropagation(),
        children: /*#__PURE__*/ jsx(Checkbox, {
            "aria-label": formatMessage({
                id: 'app.component.table.select.one-entry',
                defaultMessage: `Select {target}`
            }, {
                target: id
            }),
            disabled: rows.length === 0,
            checked: isChecked,
            onCheckedChange: handleSelectRow
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/ /**
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
 */ const Table = {
    Root,
    Content,
    ActionBar,
    Head,
    HeaderCell,
    HeaderCheckboxCell,
    Body,
    CheckboxCell,
    Cell,
    Row,
    Loading,
    Empty
};

export { Table, useTable };
//# sourceMappingURL=Table.mjs.map
