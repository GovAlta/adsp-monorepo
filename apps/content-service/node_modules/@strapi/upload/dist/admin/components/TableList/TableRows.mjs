import { jsx, jsxs } from 'react/jsx-runtime';
import { Tbody, Tr, Td, Checkbox, Flex, IconButton } from '@strapi/design-system';
import { Eye, Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { tableHeaders } from '../../constants.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../utils/urlYupSchema.mjs';
import { CellContent } from './CellContent.mjs';

const TableRows = ({ onChangeFolder = null, onEditAsset, onEditFolder, onSelectOne, rows = [], selected = [] })=>{
    const { formatMessage } = useIntl();
    const handleRowClickFn = (element, id, path, elementType)=>{
        if (elementType === 'asset') {
            onEditAsset(element);
        } else {
            if (onChangeFolder) {
                onChangeFolder(id, path);
            }
        }
    };
    return /*#__PURE__*/ jsx(Tbody, {
        children: rows.map((element)=>{
            const { path, id, isSelectable, name, folderURL, type: contentType } = element;
            const isSelected = !!selected.find((currentRow)=>currentRow.id === id && currentRow.type === contentType);
            return /*#__PURE__*/ jsxs(Tr, {
                onClick: ()=>handleRowClickFn(element, id, path || undefined, contentType),
                children: [
                    /*#__PURE__*/ jsx(Td, {
                        onClick: (e)=>e.stopPropagation(),
                        children: /*#__PURE__*/ jsx(Checkbox, {
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
                    tableHeaders.map(({ name, type: cellType })=>{
                        return /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(CellContent, {
                                content: element,
                                cellType: cellType,
                                contentType: contentType,
                                name: name
                            })
                        }, name);
                    }),
                    /*#__PURE__*/ jsx(Td, {
                        onClick: (e)=>e.stopPropagation(),
                        children: /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "flex-end",
                            children: [
                                contentType === 'folder' && (folderURL ? /*#__PURE__*/ jsx(IconButton, {
                                    tag: Link,
                                    label: formatMessage({
                                        id: getTrad('list.folders.link-label'),
                                        defaultMessage: 'Access folder'
                                    }),
                                    to: folderURL,
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Eye, {})
                                }) : /*#__PURE__*/ jsx(IconButton, {
                                    tag: "button",
                                    label: formatMessage({
                                        id: getTrad('list.folders.link-label'),
                                        defaultMessage: 'Access folder'
                                    }),
                                    onClick: ()=>onChangeFolder && onChangeFolder(id),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Eye, {})
                                })),
                                /*#__PURE__*/ jsx(IconButton, {
                                    label: formatMessage({
                                        id: getTrad('control-card.edit'),
                                        defaultMessage: 'Edit'
                                    }),
                                    onClick: ()=>contentType === 'asset' ? onEditAsset(element) : onEditFolder(element),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Pencil, {})
                                })
                            ]
                        })
                    })
                ]
            }, id);
        })
    });
};

export { TableRows };
//# sourceMappingURL=TableRows.mjs.map
