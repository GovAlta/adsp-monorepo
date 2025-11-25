import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Box, Typography } from '@strapi/design-system';
import { STAGE_COLOR_DEFAULT } from '../../../../constants.mjs';
import { getStageColorByHex } from '../../../../utils/colors.mjs';
import { getDisplayName } from '../../../../utils/users.mjs';

const StageColumn = (props)=>{
    const { color = STAGE_COLOR_DEFAULT, name } = props.strapi_stage ?? {};
    const { themeColorName } = getStageColorByHex(color) ?? {};
    return /*#__PURE__*/ jsxs(Flex, {
        alignItems: "center",
        gap: 2,
        maxWidth: "30rem",
        children: [
            /*#__PURE__*/ jsx(Box, {
                height: 2,
                background: color,
                borderColor: themeColorName === 'neutral0' ? 'neutral150' : undefined,
                hasRadius: true,
                shrink: 0,
                width: 2
            }),
            /*#__PURE__*/ jsx(Typography, {
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
    return /*#__PURE__*/ jsx(Typography, {
        textColor: "neutral800",
        children: user ? getDisplayName(user) : '-'
    });
};

export { AssigneeColumn, StageColumn };
//# sourceMappingURL=TableColumns.mjs.map
