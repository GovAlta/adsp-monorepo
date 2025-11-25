'use strict';

var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const OptionBoxWrapper = styledComponents.styled(designSystem.Box)`
  width: 100%;
  height: 100%;
  border: 1px solid ${({ theme })=>theme.colors.neutral200};
  text-align: left;
  &:hover {
    cursor: pointer;
    background: ${({ theme })=>theme.colors.primary100};
    border: 1px solid ${({ theme })=>theme.colors.primary200};
  }
`;

exports.OptionBoxWrapper = OptionBoxWrapper;
//# sourceMappingURL=OptionBoxWrapper.js.map
