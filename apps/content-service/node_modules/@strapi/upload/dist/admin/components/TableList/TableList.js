'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var constants = require('../../constants.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../utils/urlYupSchema.js');
var TableRows = require('./TableRows.js');

// TODO: find a better naming convention for the file that was an index file before
const TableList = ({ assetCount = 0, folderCount = 0, indeterminate = false, onChangeSort = null, onChangeFolder = null, onEditAsset = null, onEditFolder = null, onSelectAll, onSelectOne, rows = [], selected = [], shouldDisableBulkSelect = false, sortQuery = '' })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [sortBy, sortOrder] = sortQuery.split(':');
    const handleClickSort = (isSorted, name)=>{
        const nextSortOrder = isSorted && sortOrder === 'ASC' ? 'DESC' : 'ASC';
        const nextSort = `${name}:${nextSortOrder}`;
        onChangeSort && onChangeSort(nextSort);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
        colCount: constants.tableHeaders.length + 2,
        rowCount: assetCount + folderCount + 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                                "aria-label": formatMessage({
                                    id: getTrad.getTrad('bulk.select.label'),
                                    defaultMessage: 'Select all folders & assets'
                                }),
                                disabled: shouldDisableBulkSelect,
                                onCheckedChange: (checked)=>onSelectAll(checked, rows),
                                checked: indeterminate && !shouldDisableBulkSelect ? 'indeterminate' : (assetCount > 0 || folderCount > 0) && selected.length === assetCount + folderCount
                            })
                        }),
                        constants.tableHeaders.map(({ metadatas: { label, isSortable }, name, key })=>{
                            const isSorted = sortBy === name;
                            const isUp = sortOrder === 'ASC';
                            const tableHeaderLabel = formatMessage(label);
                            const sortLabel = formatMessage({
                                id: 'list.table.header.sort',
                                defaultMessage: 'Sort on {label}'
                            }, {
                                label: tableHeaderLabel
                            });
                            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                action: isSorted && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    label: sortLabel,
                                    onClick: ()=>handleClickSort(isSorted, name),
                                    variant: "ghost",
                                    children: isUp ? /*#__PURE__*/ jsxRuntime.jsx(icons.CaretUp, {}) : /*#__PURE__*/ jsxRuntime.jsx(icons.CaretDown, {})
                                }),
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                                    label: isSortable ? sortLabel : tableHeaderLabel,
                                    children: isSortable ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        onClick: ()=>handleClickSort(isSorted, name),
                                        tag: isSorted ? 'span' : 'button',
                                        textColor: "neutral600",
                                        variant: "sigma",
                                        children: tableHeaderLabel
                                    }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral600",
                                        variant: "sigma",
                                        children: tableHeaderLabel
                                    })
                                })
                            }, key);
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                children: formatMessage({
                                    id: getTrad.getTrad('list.table.header.actions'),
                                    defaultMessage: 'actions'
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(TableRows.TableRows, {
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

exports.TableList = TableList;
//# sourceMappingURL=TableList.js.map
