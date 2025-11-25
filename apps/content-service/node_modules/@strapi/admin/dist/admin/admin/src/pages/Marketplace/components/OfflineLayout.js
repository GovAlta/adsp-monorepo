'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var Layout = require('../../../components/Layouts/Layout.js');
var PageHeader = require('./PageHeader.js');

const OfflineLayout = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Root, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PageHeader.PageHeader, {}),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    width: "100%",
                    direction: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: `12rem`,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingBottom: 2,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "neutral700",
                                variant: "alpha",
                                children: formatMessage({
                                    id: 'admin.pages.MarketPlacePage.offline.title',
                                    defaultMessage: 'You are offline'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingBottom: 6,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "neutral700",
                                variant: "epsilon",
                                children: formatMessage({
                                    id: 'admin.pages.MarketPlacePage.offline.subtitle',
                                    defaultMessage: 'You need to be connected to the Internet to access Strapi Market.'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs("svg", {
                            width: "88",
                            height: "88",
                            viewBox: "0 0 88 88",
                            fill: "none",
                            xmlns: "http://www.w3.org/2000/svg",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx("rect", {
                                    x: ".5",
                                    y: ".5",
                                    width: "87",
                                    height: "87",
                                    rx: "43.5",
                                    fill: "#F0F0FF"
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx("path", {
                                    d: "M34 39.3h-4c-2.6 0-4.7 1-6.6 2.8a9 9 0 0 0-2.7 6.6 9 9 0 0 0 2.7 6.6A9 9 0 0 0 30 58h22.8L34 39.3Zm-11-11 3-3 39 39-3 3-4.7-4.6H30a13.8 13.8 0 0 1-14-14c0-3.8 1.3-7 4-9.7 2.6-2.7 5.7-4.2 9.5-4.3L23 28.2Zm38.2 11.1c3 .2 5.5 1.5 7.6 3.7A11 11 0 0 1 72 51c0 4-1.6 7.2-5 9.5l-3.3-3.4a6.5 6.5 0 0 0 3.6-6.1c0-1.9-.7-3.5-2-5-1.5-1.3-3.1-2-5-2h-3.5v-1.2c0-3.6-1.2-6.6-3.7-9a13 13 0 0 0-15-2.3L34.6 28a17 17 0 0 1 20.3 1.5c3.5 2.7 5.5 6 6.3 10Z",
                                    fill: "#4945FF"
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx("rect", {
                                    x: ".5",
                                    y: ".5",
                                    width: "87",
                                    height: "87",
                                    rx: "43.5",
                                    stroke: "#D9D8FF"
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
};

exports.OfflineLayout = OfflineLayout;
//# sourceMappingURL=OfflineLayout.js.map
