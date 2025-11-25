'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var constants = require('../../../../constants.js');
var colors = require('../../../../utils/colors.js');
var users = require('../../../../utils/users.js');

const StageColumn = (props)=>{
    const { color = constants.STAGE_COLOR_DEFAULT, name } = props.strapi_stage ?? {};
    const { themeColorName } = colors.getStageColorByHex(color) ?? {};
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        alignItems: "center",
        gap: 2,
        maxWidth: "30rem",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                height: 2,
                background: color,
                borderColor: themeColorName === 'neutral0' ? 'neutral150' : undefined,
                hasRadius: true,
                shrink: 0,
                width: 2
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                fontWeight: "regular",
                textColor: "neutral700",
                ellipsis: true,
                children: name
            })
        ]
    });
};
const AssigneeColumn = (props)=>{
    const { strapi_assignee: user } = props;
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        textColor: "neutral800",
        children: user ? users.getDisplayName(user) : '-'
    });
};

exports.AssigneeColumn = AssigneeColumn;
exports.StageColumn = StageColumn;
//# sourceMappingURL=TableColumns.js.map
