import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../../utils/getTrad.mjs';
import 'qs';
import '../../../../constants.mjs';
import '../../../../utils/urlYupSchema.mjs';
import { BulkDeleteButton } from './BulkDeleteButton.mjs';
import { BulkMoveButton } from './BulkMoveButton.mjs';

const BulkActions = ({ selected = [], onSuccess, currentFolder })=>{
    const { formatMessage } = useIntl();
    const numberAssets = selected?.reduce(function(_this, val) {
        return val?.type === 'folder' && 'files' in val && val?.files && 'count' in val.files ? _this + val?.files?.count : _this + 1;
    }, 0);
    return /*#__PURE__*/ jsxs(Flex, {
        gap: 2,
        paddingBottom: 5,
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "epsilon",
                textColor: "neutral600",
                children: formatMessage({
                    id: getTrad('list.assets.selected'),
                    defaultMessage: '{numberFolders, plural, one {1 folder} other {# folders}} - {numberAssets, plural, one {1 asset} other {# assets}} selected'
                }, {
                    numberFolders: selected?.filter(({ type })=>type === 'folder').length,
                    numberAssets
                })
            }),
            /*#__PURE__*/ jsx(BulkDeleteButton, {
                selected: selected,
                onSuccess: onSuccess
            }),
            /*#__PURE__*/ jsx(BulkMoveButton, {
                currentFolder: currentFolder,
                selected: selected,
                onSuccess: onSuccess
            })
        ]
    });
};

export { BulkActions };
//# sourceMappingURL=BulkActions.mjs.map
