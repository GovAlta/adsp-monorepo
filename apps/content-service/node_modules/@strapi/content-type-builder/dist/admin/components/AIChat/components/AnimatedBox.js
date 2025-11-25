'use strict';

var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

/**
 * Translates and fades in from a specified direction.
 */ const AnimatedBox = styledComponents.styled(designSystem.Box)`
  opacity: 0;
  transform: ${({ $direction = 'up' })=>$direction === 'up' ? 'translateY(10px)' : 'translateX(-10px)'};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${({ $direction = 'up' })=>$direction === 'up' ? 'appearUp' : 'appearLeft'}
      ${({ theme })=>theme.motion.timings['200']}
      ${({ theme })=>theme.motion.easings.easeOutQuad} forwards;
  }

  @keyframes appearUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes appearLeft {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

exports.AnimatedBox = AnimatedBox;
//# sourceMappingURL=AnimatedBox.js.map
