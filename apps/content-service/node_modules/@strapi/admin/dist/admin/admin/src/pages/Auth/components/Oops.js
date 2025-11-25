'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var UnauthenticatedLogo = require('../../../components/UnauthenticatedLogo.js');
var UnauthenticatedLayout = require('../../../layouts/UnauthenticatedLayout.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const Oops = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { search: searchString } = reactRouterDom.useLocation();
    const query = React__namespace.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    const message = query.get('info') || formatMessage({
        id: 'Auth.components.Oops.text',
        defaultMessage: 'Your account has been suspended.'
    });
    return /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.LayoutContent, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.Column, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLogo.Logo, {}),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 6,
                                paddingBottom: 7,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    tag: "h1",
                                    variant: "alpha",
                                    children: formatMessage({
                                        id: 'Auth.components.Oops.title',
                                        defaultMessage: 'Oops...'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                children: message
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 4,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    children: formatMessage({
                                        id: 'Auth.components.Oops.text.admin',
                                        defaultMessage: 'If this is a mistake, please contact your administrator.'
                                    })
                                })
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            tag: reactRouterDom.NavLink,
                            to: "/auth/login",
                            children: formatMessage({
                                id: 'Auth.link.signin',
                                defaultMessage: 'Sign in'
                            })
                        })
                    })
                })
            ]
        })
    });
};

exports.Oops = Oops;
//# sourceMappingURL=Oops.js.map
