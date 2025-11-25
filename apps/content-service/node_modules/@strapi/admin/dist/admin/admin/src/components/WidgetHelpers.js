'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');

const Loading = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
            children: children ?? formatMessage({
                id: 'HomePage.widget.loading',
                defaultMessage: 'Loading widget content'
            })
        })
    });
};
const Error = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        height: "100%",
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                width: "3.2rem",
                height: "3.2rem",
                fill: "danger600"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "delta",
                children: formatMessage({
                    id: 'global.error',
                    defaultMessage: 'Something went wrong'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                children: children ?? formatMessage({
                    id: 'HomePage.widget.error',
                    defaultMessage: "Couldn't load widget content."
                })
            })
        ]
    });
};
const NoData = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        height: "100%",
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
                width: "16rem",
                height: "8.8rem"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                children: children ?? formatMessage({
                    id: 'HomePage.widget.no-data',
                    defaultMessage: 'No content found.'
                })
            })
        ]
    });
};
const NoPermissions = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        height: "100%",
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyPermissions, {
                width: "16rem",
                height: "8.8rem"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                children: children ?? formatMessage({
                    id: 'HomePage.widget.no-permissions',
                    defaultMessage: 'You don’t have the permission to see this widget'
                })
            })
        ]
    });
};
const Widget = {
    Loading,
    Error,
    NoData,
    NoPermissions
};

exports.Widget = Widget;
//# sourceMappingURL=WidgetHelpers.js.map
