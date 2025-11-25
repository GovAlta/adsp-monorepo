'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');
var AssetGridList = require('../../AssetGridList/AssetGridList.js');

// TODO: find a better naming convention for the file that was an index file before
const SelectedStep = ({ selectedAssets, onSelectAsset, onReorderAsset })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 4,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 0,
                direction: "column",
                alignItems: "start",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "pi",
                        fontWeight: "bold",
                        textColor: "neutral800",
                        children: formatMessage({
                            id: getTrad.getTrad('list.assets.to-upload'),
                            defaultMessage: '{number, plural, =0 {No asset} one {1 asset} other {# assets}} ready to upload'
                        }, {
                            number: selectedAssets.length
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "pi",
                        textColor: "neutral600",
                        children: formatMessage({
                            id: getTrad.getTrad('modal.upload-list.sub-header-subtitle'),
                            defaultMessage: 'Manage the assets before adding them to the Media Library'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(AssetGridList.AssetGridList, {
                size: "S",
                assets: selectedAssets,
                onSelectAsset: onSelectAsset,
                selectedAssets: selectedAssets,
                onReorderAsset: onReorderAsset
            })
        ]
    });
};

exports.SelectedStep = SelectedStep;
//# sourceMappingURL=SelectedStep.js.map
