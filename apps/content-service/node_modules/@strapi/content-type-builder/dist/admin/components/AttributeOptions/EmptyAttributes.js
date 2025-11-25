'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var Symbols = require('@strapi/icons/symbols');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var getTrad = require('../../utils/getTrad.js');

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

var qs__namespace = /*#__PURE__*/_interopNamespaceDefault(qs);

const EmptyCard = styledComponents.styled(designSystem.Box)`
  background: ${({ theme })=>`linear-gradient(180deg, rgba(234, 234, 239, 0) 0%, ${theme.colors.neutral150} 100%)`};
  opacity: 0.33;
`;
const EmptyCardGrid = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        wrap: "wrap",
        gap: 4,
        children: [
            ...Array(4)
        ].map((_, idx)=>{
            return /*#__PURE__*/ jsxRuntime.jsx(EmptyCard, {
                height: "138px",
                width: "375px",
                hasRadius: true
            }, `empty-card-${idx}`);
        })
    });
};
const EmptyAttributes = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        position: "relative",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(EmptyCardGrid, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                position: "absolute",
                top: 6,
                width: "100%",
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    alignItems: "center",
                    justifyContent: "center",
                    direction: "column",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(Symbols.EmptyDocuments, {
                            width: "160px",
                            height: "88px"
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingTop: 6,
                            paddingBottom: 4,
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                textAlign: "center",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        variant: "delta",
                                        tag: "p",
                                        textColor: "neutral600",
                                        children: formatMessage({
                                            id: getTrad.getTrad('modalForm.empty.heading'),
                                            defaultMessage: 'Nothing in here yet.'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        paddingTop: 4,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "delta",
                                            tag: "p",
                                            textColor: "neutral600",
                                            children: formatMessage({
                                                id: getTrad.getTrad('modalForm.empty.sub-heading'),
                                                defaultMessage: 'Find what you are looking for through a wide range of extensions.'
                                            })
                                        })
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                            tag: reactRouterDom.Link,
                            to: `/marketplace?${qs__namespace.stringify({
                                categories: [
                                    'Custom fields'
                                ]
                            })}`,
                            variant: "secondary",
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Plus, {}),
                            children: formatMessage({
                                id: getTrad.getTrad('modalForm.empty.button'),
                                defaultMessage: 'Add custom fields'
                            })
                        })
                    ]
                })
            })
        ]
    });
};

exports.EmptyAttributes = EmptyAttributes;
exports.EmptyCardGrid = EmptyCardGrid;
//# sourceMappingURL=EmptyAttributes.js.map
