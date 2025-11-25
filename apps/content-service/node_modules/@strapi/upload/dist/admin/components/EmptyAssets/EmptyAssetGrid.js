'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const EmptyAssetCard = styledComponents.styled(designSystem.Box)`
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
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Grid, {
        size: size,
        children: Array(count).fill(null).map((_, idx)=>/*#__PURE__*/ jsxRuntime.jsx(EmptyAssetCard, {
                height: `${PlaceholderSize[size]}px`,
                hasRadius: true
            }, `empty-asset-card-${idx}`))
    });
};

exports.EmptyAssetGrid = EmptyAssetGrid;
//# sourceMappingURL=EmptyAssetGrid.js.map
