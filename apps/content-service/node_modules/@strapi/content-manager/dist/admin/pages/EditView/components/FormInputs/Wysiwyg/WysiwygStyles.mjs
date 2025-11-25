import { IconButtonGroup, IconButton, Button } from '@strapi/design-system';
import { styled } from 'styled-components';

// NAV BUTTONS
styled(IconButtonGroup)`
  margin-left: ${({ theme })=>theme.spaces[4]};
`;
styled(IconButton)`
  margin: ${({ theme })=>`0 ${theme.spaces[2]}`};
`;
// NAV
styled(IconButtonGroup)`
  margin-right: ${({ theme })=>`${theme.spaces[2]}`};
`;
// FOOTER
const ExpandButton = styled(Button)`
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

export { ExpandButton };
//# sourceMappingURL=WysiwygStyles.mjs.map
