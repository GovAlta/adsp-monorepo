'use strict';

var styledComponents = require('styled-components');

const ANIMATIONS = {
    fadeIn: styledComponents.keyframes`
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  `,
    scaleIn: styledComponents.keyframes`
    from {
      opacity: 0;
      transform: scale(0.7);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  `,
    slideUpIn: styledComponents.keyframes`
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
    slideUpOut: styledComponents.keyframes`
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(10px);
    }
  `,
    slideDownIn: styledComponents.keyframes`
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
    slideDownOut: styledComponents.keyframes`
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  `
};

exports.ANIMATIONS = ANIMATIONS;
//# sourceMappingURL=animations.js.map
