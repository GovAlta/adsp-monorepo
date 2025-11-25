'use strict';

var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

// NAV BUTTONS
styledComponents.styled(designSystem.IconButtonGroup)`
  margin-left: ${({ theme })=>theme.spaces[4]};
`;
styledComponents.styled(designSystem.IconButton)`
  margin: ${({ theme })=>`0 ${theme.spaces[2]}`};
`;
// NAV
styledComponents.styled(designSystem.IconButtonGroup)`
  margin-right: ${({ theme })=>`${theme.spaces[2]}`};
`;
// FOOTER
const ExpandButton = styledComponents.styled(designSystem.Button)`
  background-color: transparent;
  border: none;
  align-items: center;

  & > span {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-weight: ${({ theme })=>theme.fontWeights.regular};
  }

  svg {
    margin-left: ${({ theme })=>`${theme.spaces[2]}`};
    path {
      fill: ${({ theme })=>theme.colors.neutral700};
      width: 1.2rem;
      height: 1.2rem;
    }
  }
`;

exports.ExpandButton = ExpandButton;
//# sourceMappingURL=WysiwygStyles.js.map
