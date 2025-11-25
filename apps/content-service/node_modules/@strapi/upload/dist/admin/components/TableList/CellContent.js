'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var parseISO = require('date-fns/parseISO');
var reactIntl = require('react-intl');
var formatBytes = require('../../utils/formatBytes.js');
require('date-fns');
require('qs');
var getFileExtension = require('../../utils/getFileExtension.js');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var PreviewCell = require('./PreviewCell.js');

const CellContent = ({ cellType, contentType, content, name })=>{
    const { formatDate, formatMessage } = reactIntl.useIntl();
    const contentValue = content[name];
    switch(cellType){
        case 'image':
            return /*#__PURE__*/ jsxRuntime.jsx(PreviewCell.PreviewCell, {
                type: contentType,
                content: content
            });
        case 'date':
            if (typeof contentValue === 'string') {
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: formatDate(parseISO(contentValue), {
                        dateStyle: 'full'
                    })
                });
            }
        case 'size':
            if (contentType === 'folder') return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                "aria-label": formatMessage({
                    id: 'list.table.content.empty-label',
                    defaultMessage: 'This field is empty'
                }),
                children: "-"
            });
            if (typeof contentValue === 'string' || typeof contentValue === 'number') {
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: formatBytes.formatBytes(contentValue)
                });
            }
        case 'ext':
            if (contentType === 'folder') return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                "aria-label": formatMessage({
                    id: 'list.table.content.empty-label',
                    defaultMessage: 'This field is empty'
                }),
                children: "-"
            });
            if (typeof contentValue === 'string') {
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: getFileExtension.getFileExtension(contentValue)?.toUpperCase()
                });
            }
        case 'text':
            if (typeof contentValue === 'string') {
                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: contentValue
                });
            }
        default:
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                "aria-label": formatMessage({
                    id: 'list.table.content.empty-label',
                    defaultMessage: 'This field is empty'
                }),
                children: "-"
            });
    }
};

exports.CellContent = CellContent;
//# sourceMappingURL=CellContent.js.map
