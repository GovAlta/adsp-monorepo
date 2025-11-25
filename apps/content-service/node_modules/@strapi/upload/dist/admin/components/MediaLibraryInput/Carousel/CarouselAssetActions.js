'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var prefixFileUrlWithBackendUrl = require('../../../utils/prefixFileUrlWithBackendUrl.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');
var CopyLinkButton = require('../../CopyLinkButton/CopyLinkButton.js');

const CarouselAssetActions = ({ asset, onDeleteAsset, onAddAsset, onEditAsset })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CarouselActions, {
        children: [
            onAddAsset && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                label: formatMessage({
                    id: getTrad.getTrad('control-card.add'),
                    defaultMessage: 'Add'
                }),
                onClick: ()=>onAddAsset(asset),
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {})
            }),
            /*#__PURE__*/ jsxRuntime.jsx(CopyLinkButton.CopyLinkButton, {
                url: prefixFileUrlWithBackendUrl.prefixFileUrlWithBackendUrl(asset.url)
            }),
            onDeleteAsset && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                label: formatMessage({
                    id: 'global.delete',
                    defaultMessage: 'Delete'
                }),
                onClick: ()=>onDeleteAsset(asset),
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
            }),
            onEditAsset && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                label: formatMessage({
                    id: getTrad.getTrad('control-card.edit'),
                    defaultMessage: 'edit'
                }),
                onClick: onEditAsset,
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
            })
        ]
    });
};

exports.CarouselAssetActions = CarouselAssetActions;
//# sourceMappingURL=CarouselAssetActions.js.map
