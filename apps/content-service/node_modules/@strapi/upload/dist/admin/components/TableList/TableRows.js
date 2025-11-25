'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var constants = require('../../constants.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../utils/urlYupSchema.js');
var CellContent = require('./CellContent.js');

const TableRows = ({ onChangeFolder = null, onEditAsset, onEditFolder, onSelectOne, rows = [], selected = [] })=>{
    const { formatMessage } = reactIntl.useIntl();
    const handleRowClickFn = (element, id, path, elementType)=>{
        if (elementType === 'asset') {
            onEditAsset(element);
        } else {
            if (onChangeFolder) {
                onChangeFolder(id, path);
            }
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
        children: rows.map((element)=>{
            const { path, id, isSelectable, name, folderURL, type: contentType } = element;
            const isSelected = !!selected.find((currentRow)=>currentRow.id === id && currentRow.type === contentType);
            return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                onClick: ()=>handleRowClickFn(element, id, path || undefined, contentType),
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                        onClick: (e)=>e.stopPropagation(),
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                            "aria-label": formatMessage({
                                id: contentType === 'asset' ? 'list-assets-select' : 'list.folder.select',
                                defaultMessage: contentType === 'asset' ? 'Select {name} asset' : 'Select {name} folder'
                            }, {
                                name
                            }),
                            disabled: !isSelectable,
                            onCheckedChange: ()=>onSelectOne(element),
                            checked: isSelected
                        })
                    }),
                    constants.tableHeaders.map(({ name, type: cellType })=>{
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(CellContent.CellContent, {
                                content: element,
                                cellType: cellType,
                                contentType: contentType,
                                name: name
                            })
                        }, name);
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                        onClick: (e)=>e.stopPropagation(),
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "flex-end",
                            children: [
                                contentType === 'folder' && (folderURL ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    tag: reactRouterDom.Link,
                                    label: formatMessage({
                                        id: getTrad.getTrad('list.folders.link-label'),
                                        defaultMessage: 'Access folder'
                                    }),
                                    to: folderURL,
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Eye, {})
                                }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    tag: "button",
                                    label: formatMessage({
                                        id: getTrad.getTrad('list.folders.link-label'),
                                        defaultMessage: 'Access folder'
                                    }),
                                    onClick: ()=>onChangeFolder && onChangeFolder(id),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Eye, {})
                                })),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    label: formatMessage({
                                        id: getTrad.getTrad('control-card.edit'),
                                        defaultMessage: 'Edit'
                                    }),
                                    onClick: ()=>contentType === 'asset' ? onEditAsset(element) : onEditFolder(element),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                })
                            ]
                        })
                    })
                ]
            }, id);
        })
    });
};

exports.TableRows = TableRows;
//# sourceMappingURL=TableRows.js.map
