'use strict';

var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const ComponentRow = styledComponents.styled(designSystem.Box)`
  &.component-row,
  &.dynamiczone-row {
    position: relative;

    > ul:first-of-type {
      padding: 0 0 0 104px;
      position: relative;

      &::before {
        content: '';
        width: 0.4rem;
        height: ${({ $isFromDynamicZone })=>$isFromDynamicZone ? 'calc(100% - 65px)' : 'calc(100%)'};
        position: absolute;
        left: 7rem;
        border-radius: 4px;

        ${({ $isFromDynamicZone, $isChildOfDynamicZone, theme })=>{
    if ($isChildOfDynamicZone) {
        return `background-color: ${theme.colors.primary200};`;
    }
    if ($isFromDynamicZone) {
        return `background-color: ${theme.colors.primary200};`;
    }
    return `background: ${theme.colors.neutral150};`;
}}
      }
    }
  }

  &.dynamiczone-row > ul:first-of-type {
    padding: 0;
  }
`;

exports.ComponentRow = ComponentRow;
//# sourceMappingURL=ComponentRow.js.map
