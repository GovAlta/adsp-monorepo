'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../../../utils/getTrad.js');
require('qs');
require('../../../../constants.js');
require('../../../../utils/urlYupSchema.js');
var BulkDeleteButton = require('./BulkDeleteButton.js');
var BulkMoveButton = require('./BulkMoveButton.js');

const BulkActions = ({ selected = [], onSuccess, currentFolder })=>{
    const { formatMessage } = reactIntl.useIntl();
    const numberAssets = selected?.reduce(function(_this, val) {
        return val?.type === 'folder' && 'files' in val && val?.files && 'count' in val.files ? _this + val?.files?.count : _this + 1;
    }, 0);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 2,
        paddingBottom: 5,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "epsilon",
                textColor: "neutral600",
                children: formatMessage({
                    id: getTrad.getTrad('list.assets.selected'),
                    defaultMessage: '{numberFolders, plural, one {1 folder} other {# folders}} - {numberAssets, plural, one {1 asset} other {# assets}} selected'
                }, {
                    numberFolders: selected?.filter(({ type })=>type === 'folder').length,
                    numberAssets
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(BulkDeleteButton.BulkDeleteButton, {
                selected: selected,
                onSuccess: onSuccess
            }),
            /*#__PURE__*/ jsxRuntime.jsx(BulkMoveButton.BulkMoveButton, {
                currentFolder: currentFolder,
                selected: selected,
                onSuccess: onSuccess
            })
        ]
    });
};

exports.BulkActions = BulkActions;
//# sourceMappingURL=BulkActions.js.map
