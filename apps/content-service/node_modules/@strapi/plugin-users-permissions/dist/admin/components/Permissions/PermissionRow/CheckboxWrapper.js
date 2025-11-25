'use strict';

var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const activeCheckboxWrapperStyles = styledComponents.css`
  background: ${(props)=>props.theme.colors.primary100};

  #cog {
    opacity: 1;
  }
`;
const CheckboxWrapper = styledComponents.styled(designSystem.Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;

  #cog {
    opacity: 0;
    path {
      fill: ${(props)=>props.theme.colors.primary600};
    }
  }

  /* Show active style both on hover and when the action is selected */
  ${(props)=>props.isActive && activeCheckboxWrapperStyles}
  &:hover {
    ${activeCheckboxWrapperStyles}
  }
`;

module.exports = CheckboxWrapper;
//# sourceMappingURL=CheckboxWrapper.js.map
