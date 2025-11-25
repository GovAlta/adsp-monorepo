'use strict';

var designSystem = require('@strapi/design-system');
var styled = require('styled-components');

const CollapseLabel = styled.styled(designSystem.Flex)`
  padding-right: ${({ theme })=>theme.spaces[2]};
  overflow: hidden;
  flex: 1;
  ${({ $isCollapsable })=>$isCollapsable && 'cursor: pointer;'}
`;

exports.CollapseLabel = CollapseLabel;
//# sourceMappingURL=CollapseLabel.js.map
