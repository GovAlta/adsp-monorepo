'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var FolderCard$1 = require('../contexts/FolderCard.js');

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

const FauxClickWrapper = styledComponents.styled.button`
  height: 100%;
  left: 0;
  position: absolute;
  opacity: 0;
  top: 0;
  width: 100%;

  &:hover,
  &:focus {
    text-decoration: none;
  }
`;
const StyledFolder = styledComponents.styled(icons.Folder)`
  path {
    fill: currentColor;
  }
`;
const CardActionDisplay = styledComponents.styled(designSystem.Box)`
  display: none;
`;
const Card = styledComponents.styled(designSystem.Box)`
  &:hover,
  &:focus-within {
    ${CardActionDisplay} {
      display: ${({ $isCardActions })=>$isCardActions ? 'block' : ''};
    }
  }
`;
const FolderCard = /*#__PURE__*/ React__namespace.forwardRef(({ children, startAction = null, cardActions = null, ariaLabel, onClick, to, ...props }, ref)=>{
    const generatedId = React__namespace.useId();
    const fodlerCtxValue = React__namespace.useMemo(()=>({
            id: generatedId
        }), [
        generatedId
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(FolderCard$1.FolderCardContext.Provider, {
        value: fodlerCtxValue,
        children: /*#__PURE__*/ jsxRuntime.jsxs(Card, {
            position: "relative",
            tabIndex: 0,
            $isCardActions: !!cardActions,
            ref: ref,
            ...props,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(FauxClickWrapper, {
                    to: to || undefined,
                    as: to ? reactRouterDom.NavLink : 'button',
                    type: to ? undefined : 'button',
                    onClick: onClick,
                    tabIndex: -1,
                    "aria-label": ariaLabel,
                    "aria-hidden": true
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    hasRadius: true,
                    borderStyle: "solid",
                    borderWidth: "1px",
                    borderColor: "neutral150",
                    background: "neutral0",
                    shadow: "tableShadow",
                    padding: 3,
                    gap: 2,
                    cursor: "pointer",
                    children: [
                        startAction,
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            hasRadius: true,
                            background: "secondary100",
                            color: "secondary500",
                            paddingBottom: 2,
                            paddingLeft: 3,
                            paddingRight: 3,
                            paddingTop: 2,
                            children: /*#__PURE__*/ jsxRuntime.jsx(StyledFolder, {
                                width: "2.4rem",
                                height: "2.4rem"
                            })
                        }),
                        children,
                        /*#__PURE__*/ jsxRuntime.jsx(CardActionDisplay, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardAction, {
                                right: 4,
                                position: "end",
                                children: cardActions
                            })
                        })
                    ]
                })
            ]
        })
    });
});

exports.FolderCard = FolderCard;
//# sourceMappingURL=FolderCard.js.map
