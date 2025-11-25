import { jsxs, jsx } from 'react/jsx-runtime';
import { Table, Thead, Tr, Th, Checkbox, IconButton, Tooltip, Typography, VisuallyHidden } from '@strapi/design-system';
import { CaretUp, CaretDown } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { tableHeaders } from '../../constants.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../utils/urlYupSchema.mjs';
import { TableRows } from './TableRows.mjs';

// TODO: find a better naming convention for the file that was an index file before
const TableList = ({ assetCount = 0, folderCount = 0, indeterminate = false, onChangeSort = null, onChangeFolder = null, onEditAsset = null, onEditFolder = null, onSelectAll, onSelectOne, rows = [], selected = [], shouldDisableBulkSelect = false, sortQuery = '' })=>{
    const { formatMessage } = useIntl();
    const [sortBy, sortOrder] = sortQuery.split(':');
    const handleClickSort = (isSorted, name)=>{
        const nextSortOrder = isSorted && sortOrder === 'ASC' ? 'DESC' : 'ASC';
        const nextSort = `${name}:${nextSortOrder}`;
        onChangeSort && onChangeSort(nextSort);
    };
    return /*#__PURE__*/ jsxs(Table, {
        colCount: tableHeaders.length + 2,
        rowCount: assetCount + folderCount + 1,
        children: [
            /*#__PURE__*/ jsx(Thead, {
                children: /*#__PURE__*/ jsxs(Tr, {
                    children: [
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(Checkbox, {
                                "aria-label": formatMessage({
                                    id: getTrad('bulk.select.label'),
                                    defaultMessage: 'Select all folders & assets'
                                }),
                                disabled: shouldDisableBulkSelect,
                                onCheckedChange: (checked)=>onSelectAll(checked, rows),
                                checked: indeterminate && !shouldDisableBulkSelect ? 'indeterminate' : (assetCount > 0 || folderCount > 0) && selected.length === assetCount + folderCount
                            })
                        }),
                        tableHeaders.map(({ metadatas: { label, isSortable }, name, key })=>{
                            const isSorted = sortBy === name;
                            const isUp = sortOrder === 'ASC';
                            const tableHeaderLabel = formatMessage(label);
                            const sortLabel = formatMessage({
                                id: 'list.table.header.sort',
                                defaultMessage: 'Sort on {label}'
                            }, {
                                label: tableHeaderLabel
                            });
                            return /*#__PURE__*/ jsx(Th, {
                                action: isSorted && /*#__PURE__*/ jsx(IconButton, {
                                    label: sortLabel,
                                    onClick: ()=>handleClickSort(isSorted, name),
                                    variant: "ghost",
                                    children: isUp ? /*#__PURE__*/ jsx(CaretUp, {}) : /*#__PURE__*/ jsx(CaretDown, {})
                                }),
                                children: /*#__PURE__*/ jsx(Tooltip, {
                                    label: isSortable ? sortLabel : tableHeaderLabel,
                                    children: isSortable ? /*#__PURE__*/ jsx(Typography, {
                                        onClick: ()=>handleClickSort(isSorted, name),
                                        tag: isSorted ? 'span' : 'button',
                                        textColor: "neutral600",
                                        variant: "sigma",
                                        children: tableHeaderLabel
                                    }) : /*#__PURE__*/ jsx(Typography, {
                                        textColor: "neutral600",
                                        variant: "sigma",
                                        children: tableHeaderLabel
                                    })
                                })
                            }, key);
                        }),
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                children: formatMessage({
                                    id: getTrad('list.table.header.actions'),
                                    defaultMessage: 'actions'
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(TableRows, {
                onChangeFolder: onChangeFolder,
                onEditAsset: onEditAsset,
                onEditFolder: onEditFolder,
                rows: rows,
                onSelectOne: onSelectOne,
                selected: selected
            })
        ]
    });
};

export { TableList };
//# sourceMappingURL=TableList.mjs.map
