import { jsx } from 'react/jsx-runtime';
import { Typography } from '@strapi/design-system';
import parseISO from 'date-fns/parseISO';
import { useIntl } from 'react-intl';
import { formatBytes } from '../../utils/formatBytes.mjs';
import 'date-fns';
import 'qs';
import { getFileExtension } from '../../utils/getFileExtension.mjs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { PreviewCell } from './PreviewCell.mjs';

const CellContent = ({ cellType, contentType, content, name })=>{
    const { formatDate, formatMessage } = useIntl();
    const contentValue = content[name];
    switch(cellType){
        case 'image':
            return /*#__PURE__*/ jsx(PreviewCell, {
                type: contentType,
                content: content
            });
        case 'date':
            if (typeof contentValue === 'string') {
                return /*#__PURE__*/ jsx(Typography, {
                    children: formatDate(parseISO(contentValue), {
                        dateStyle: 'full'
                    })
                });
            }
        case 'size':
            if (contentType === 'folder') return /*#__PURE__*/ jsx(Typography, {
                "aria-label": formatMessage({
                    id: 'list.table.content.empty-label',
                    defaultMessage: 'This field is empty'
                }),
                children: "-"
            });
            if (typeof contentValue === 'string' || typeof contentValue === 'number') {
                return /*#__PURE__*/ jsx(Typography, {
                    children: formatBytes(contentValue)
                });
            }
        case 'ext':
            if (contentType === 'folder') return /*#__PURE__*/ jsx(Typography, {
                "aria-label": formatMessage({
                    id: 'list.table.content.empty-label',
                    defaultMessage: 'This field is empty'
                }),
                children: "-"
            });
            if (typeof contentValue === 'string') {
                return /*#__PURE__*/ jsx(Typography, {
                    children: getFileExtension(contentValue)?.toUpperCase()
                });
            }
        case 'text':
            if (typeof contentValue === 'string') {
                return /*#__PURE__*/ jsx(Typography, {
                    children: contentValue
                });
            }
        default:
            return /*#__PURE__*/ jsx(Typography, {
                "aria-label": formatMessage({
                    id: 'list.table.content.empty-label',
                    defaultMessage: 'This field is empty'
                }),
                children: "-"
            });
    }
};

export { CellContent };
//# sourceMappingURL=CellContent.mjs.map
