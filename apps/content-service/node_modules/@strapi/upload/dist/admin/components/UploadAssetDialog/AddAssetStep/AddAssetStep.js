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
var FromComputerForm = require('./FromComputerForm.js');
var FromUrlForm = require('./FromUrlForm.js');

const AddAssetStep = ({ onClose, onAddAsset, trackedLocation })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                    children: formatMessage({
                        id: getTrad.getTrad('header.actions.add-assets'),
                        defaultMessage: 'Add new assets'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Root, {
                variant: "simple",
                defaultValue: "computer",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 6,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.List, {
                                "aria-label": formatMessage({
                                    id: getTrad.getTrad('tabs.title'),
                                    defaultMessage: 'How do you want to upload your assets?'
                                }),
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                                        value: "computer",
                                        children: formatMessage({
                                            id: getTrad.getTrad('modal.nav.computer'),
                                            defaultMessage: 'From computer'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                                        value: "url",
                                        children: formatMessage({
                                            id: getTrad.getTrad('modal.nav.url'),
                                            defaultMessage: 'From URL'
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {})
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                        value: "computer",
                        children: /*#__PURE__*/ jsxRuntime.jsx(FromComputerForm.FromComputerForm, {
                            onClose: onClose,
                            onAddAssets: onAddAsset,
                            trackedLocation: trackedLocation
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                        value: "url",
                        children: /*#__PURE__*/ jsxRuntime.jsx(FromUrlForm.FromUrlForm, {
                            onClose: onClose,
                            onAddAsset: onAddAsset,
                            trackedLocation: trackedLocation
                        })
                    })
                ]
            })
        ]
    });
};

exports.AddAssetStep = AddAssetStep;
//# sourceMappingURL=AddAssetStep.js.map
