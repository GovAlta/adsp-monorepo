'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var FolderCard = require('../contexts/FolderCard.js');

const FolderCardCheckbox = (props)=>{
    const { id } = FolderCard.useFolderCard();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        position: "relative",
        zIndex: 2,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
            "aria-labelledby": `${id}-title`,
            ...props
        })
    });
};

exports.FolderCardCheckbox = FolderCardCheckbox;
//# sourceMappingURL=FolderCardCheckbox.js.map
