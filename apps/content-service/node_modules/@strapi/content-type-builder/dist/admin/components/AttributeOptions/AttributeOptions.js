'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var getTrad = require('../../utils/getTrad.js');
var AttributeList = require('./AttributeList.js');
var CustomFieldsList = require('./CustomFieldsList.js');

const AttributeOptions = ({ attributes, forTarget, kind })=>{
    const { formatMessage } = reactIntl.useIntl();
    const defaultTabId = getTrad.getTrad('modalForm.tabs.default');
    const customTabId = getTrad.getTrad('modalForm.tabs.custom');
    const titleIdSuffix = forTarget.includes('component') ? 'component' : kind;
    const titleId = getTrad.getTrad(`modalForm.sub-header.chooseAttribute.${titleIdSuffix}`);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Root, {
            variant: "simple",
            defaultValue: "default",
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    justifyContent: "space-between",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "beta",
                            tag: "h2",
                            children: formatMessage({
                                id: titleId,
                                defaultMessage: 'Select a field'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.List, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                                    value: "default",
                                    children: formatMessage({
                                        id: defaultTabId,
                                        defaultMessage: 'Default'
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                                    value: "custom",
                                    children: formatMessage({
                                        id: customTabId,
                                        defaultMessage: 'Custom'
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {
                    marginBottom: 6
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                    value: "default",
                    children: /*#__PURE__*/ jsxRuntime.jsx(AttributeList.AttributeList, {
                        attributes: attributes
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                    value: "custom",
                    children: /*#__PURE__*/ jsxRuntime.jsx(CustomFieldsList.CustomFieldsList, {})
                })
            ]
        })
    });
};

exports.AttributeOptions = AttributeOptions;
//# sourceMappingURL=AttributeOptions.js.map
