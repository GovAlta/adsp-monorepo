import { Box } from '@strapi/design-system';
import { styled } from 'styled-components';

/**
 * Translates and fades in from a specified direction.
 */ const AnimatedBox = styled(Box)`
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

export { AnimatedBox };
//# sourceMappingURL=AnimatedBox.mjs.map
