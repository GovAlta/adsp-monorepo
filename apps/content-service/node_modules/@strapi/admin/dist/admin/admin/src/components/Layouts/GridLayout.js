'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var styled = require('styled-components');

const GridColSize = {
    S: 180,
    M: 250
};
const StyledGrid = styled.styled(designSystem.Box)`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(${({ $size })=>`${GridColSize[$size]}px`}, 1fr)
  );
  grid-gap: ${({ theme })=>theme.spaces[4]};
`;
const GridLayout = ({ size, children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(StyledGrid, {
        $size: size,
        children: children
    });
};

exports.GridLayout = GridLayout;
//# sourceMappingURL=GridLayout.js.map
