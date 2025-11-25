import { jsx } from 'react/jsx-runtime';
import { Layouts } from '@strapi/admin/strapi-admin';
import { Box } from '@strapi/design-system';
import { styled } from 'styled-components';

const EmptyAssetCard = styled(Box)`
  background: linear-gradient(
    180deg,
    rgba(234, 234, 239, 0) 0%,
    ${({ theme })=>theme.colors.neutral200} 100%
  );
  opacity: 0.33;
`;
const PlaceholderSize = {
    S: 138,
    M: 234
};
const EmptyAssetGrid = ({ count, size })=>{
    return /*#__PURE__*/ jsx(Layouts.Grid, {
        size: size,
        children: Array(count).fill(null).map((_, idx)=>/*#__PURE__*/ jsx(EmptyAssetCard, {
                height: `${PlaceholderSize[size]}px`,
                hasRadius: true
            }, `empty-asset-card-${idx}`))
    });
};

export { EmptyAssetGrid };
//# sourceMappingURL=EmptyAssetGrid.mjs.map
