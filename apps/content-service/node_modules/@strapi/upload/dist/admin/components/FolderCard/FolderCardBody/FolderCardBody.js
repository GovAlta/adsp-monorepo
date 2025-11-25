'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');
var FolderCard = require('../contexts/FolderCard.js');

const StyledBox = styledComponents.styled(designSystem.Flex)`
  user-select: none;
`;
const FolderCardBody = (props)=>{
    const { id } = FolderCard.useFolderCard();
    return /*#__PURE__*/ jsxRuntime.jsx(StyledBox, {
        ...props,
        id: `${id}-title`,
        "data-testid": `${id}-title`,
        alignItems: "flex-start",
        direction: "column",
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative"
    });
};

exports.FolderCardBody = FolderCardBody;
//# sourceMappingURL=FolderCardBody.js.map
