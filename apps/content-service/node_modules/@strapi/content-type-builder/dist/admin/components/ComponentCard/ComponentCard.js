'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var get = require('lodash/get');
var styledComponents = require('styled-components');
var useDataManager = require('../DataManager/useDataManager.js');
var ComponentIcon = require('./ComponentIcon/ComponentIcon.js');

const CloseButton = styledComponents.styled(designSystem.Box)`
  position: absolute;
  display: none;
  top: 5px;
  right: 0.8rem;

  svg {
    width: 1rem;
    height: 1rem;

    path {
      fill: ${({ theme })=>theme.colors.primary600};
    }
  }
`;
const ComponentBox = styledComponents.styled(designSystem.Flex)`
  width: 14rem;
  height: 8rem;
  position: relative;
  border: 1px solid ${({ theme })=>theme.colors.neutral200};
  background: ${({ theme })=>theme.colors.neutral100};
  border-radius: ${({ theme })=>theme.borderRadius};
  max-width: 100%;

  &.active,
  &:focus,
  &:hover {
    border: 1px solid ${({ theme })=>theme.colors.primary200};
    background: ${({ theme })=>theme.colors.primary100};
    color: ${({ theme })=>theme.colors.primary600};

    ${CloseButton} {
      display: block;
    }

    /* > ComponentIcon */
    > div:first-child {
      background: ${({ theme })=>theme.colors.primary200};
      color: ${({ theme })=>theme.colors.primary600};

      svg {
        path {
          fill: ${({ theme })=>theme.colors.primary600};
        }
      }
    }
  }
`;
const ComponentCard = ({ component, dzName, index, isActive = false, isInDevelopmentMode = false, onClick, forTarget, targetUid, disabled })=>{
    const { components, removeComponentFromDynamicZone } = useDataManager.useDataManager();
    const type = get(components, component);
    const { icon, displayName } = type?.info || {};
    const onClose = (e)=>{
        e.stopPropagation();
        removeComponentFromDynamicZone({
            forTarget,
            targetUid,
            dzName,
            componentToRemoveIndex: index
        });
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(ComponentBox, {
        alignItems: "center",
        direction: "column",
        className: isActive ? 'active' : '',
        borderRadius: "borderRadius",
        justifyContent: "center",
        paddingLeft: 4,
        paddingRight: 4,
        shrink: 0,
        onClick: onClick,
        role: "tab",
        tabIndex: isActive ? 0 : -1,
        cursor: "pointer",
        "aria-selected": isActive,
        "aria-controls": `dz-${dzName}-panel-${index}`,
        id: `dz-${dzName}-tab-${index}`,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(ComponentIcon.ComponentIcon, {
                icon: icon,
                isActive: isActive
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                marginTop: 1,
                maxWidth: "100%",
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "pi",
                    fontWeight: "bold",
                    ellipsis: true,
                    children: displayName
                })
            }),
            isInDevelopmentMode && !disabled && /*#__PURE__*/ jsxRuntime.jsx(CloseButton, {
                cursor: "pointer",
                tag: "button",
                onClick: onClose,
                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {})
            })
        ]
    });
};

exports.ComponentCard = ComponentCard;
//# sourceMappingURL=ComponentCard.js.map
