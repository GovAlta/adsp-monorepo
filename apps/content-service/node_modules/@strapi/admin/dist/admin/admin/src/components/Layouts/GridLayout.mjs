import { jsx } from 'react/jsx-runtime';
import 'react';
import { Box } from '@strapi/design-system';
import { styled } from 'styled-components';

const GridColSize = {
    S: 180,
    M: 250
};
const StyledGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(${({ $size })=>`${GridColSize[$size]}px`}, 1fr)
  );
  grid-gap: ${({ theme })=>theme.spaces[4]};
`;
const GridLayout = ({ size, children })=>{
    return /*#__PURE__*/ jsx(StyledGrid, {
        $size: size,
        children: children
    });
};

export { GridLayout };
//# sourceMappingURL=GridLayout.mjs.map
