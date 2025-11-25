'use strict';

var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const Wrapper = styledComponents.styled(designSystem.Box)`
  position: relative;
  width: 100%;
  &::before {
    content: '';
    position: absolute;
    top: calc(50% - 0px);
    height: 2px;
    width: 100%;
    background-color: ${({ theme })=>theme.colors.primary600};
    z-index: 0;
  }
`;
const IconWrapper = styledComponents.styled(designSystem.Box)`
  background: ${({ theme, $isSelected })=>theme.colors[$isSelected ? 'primary100' : 'neutral0']};
  border: 1px solid
    ${({ theme, $isSelected })=>theme.colors[$isSelected ? 'primary700' : 'neutral200']};
  border-radius: ${({ theme })=>theme.borderRadius};
  z-index: 1;
  flex: 0 0 2.4rem;
  svg {
    width: 2.4rem;
    height: 2.4rem;
    max-width: unset;
    path {
      fill: ${({ theme, $isSelected })=>theme.colors[$isSelected ? 'primary700' : 'neutral500']};
    }
  }
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    background: ${({ theme })=>theme.colors.neutral150};

    svg {
      path {
        fill: ${({ theme })=>theme.colors.neutral300};
      }
    }
  }
  display: flex;
  justify-content: center;
  align-items: center;
`;
const InfosWrapper = styledComponents.styled(designSystem.Flex)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

exports.IconWrapper = IconWrapper;
exports.InfosWrapper = InfosWrapper;
exports.Wrapper = Wrapper;
//# sourceMappingURL=Components.js.map
