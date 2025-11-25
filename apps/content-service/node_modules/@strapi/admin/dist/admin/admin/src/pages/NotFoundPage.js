'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Layout = require('../components/Layouts/Layout.js');
var PageHelpers = require('../components/PageHelpers.js');

const NotFoundPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
        labelledBy: "title",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                id: "title",
                title: formatMessage({
                    id: 'content-manager.pageNotFound',
                    defaultMessage: 'Page not found'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                    action: /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                        tag: reactRouterDom.Link,
                        variant: "secondary",
                        endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ArrowRight, {}),
                        to: "/",
                        children: formatMessage({
                            id: 'app.components.NotFoundPage.back',
                            defaultMessage: 'Back to homepage'
                        })
                    }),
                    content: formatMessage({
                        id: 'app.page.not.found',
                        defaultMessage: "Oops! We can't seem to find the page you're looging for..."
                    }),
                    hasRadius: true,
                    icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyPictures, {
                        width: "16rem"
                    }),
                    shadow: "tableShadow"
                })
            })
        ]
    });
};

exports.NotFoundPage = NotFoundPage;
//# sourceMappingURL=NotFoundPage.js.map
