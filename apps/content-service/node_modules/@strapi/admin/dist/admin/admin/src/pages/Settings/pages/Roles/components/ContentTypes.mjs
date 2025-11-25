import { jsxs, jsx } from 'react/jsx-runtime';
import { Box } from '@strapi/design-system';
import { ContentTypeCollapses } from './ContentTypeCollapses.mjs';
import { GlobalActions } from './GlobalActions.mjs';

const ContentTypes = ({ isFormDisabled, kind, layout: { actions, subjects } })=>{
    const sortedSubjects = [
        ...subjects
    ].sort((a, b)=>a.label.localeCompare(b.label));
    return /*#__PURE__*/ jsxs(Box, {
        background: "neutral0",
        children: [
            /*#__PURE__*/ jsx(GlobalActions, {
                actions: actions,
                kind: kind,
                isFormDisabled: isFormDisabled
            }),
            /*#__PURE__*/ jsx(ContentTypeCollapses, {
                actions: actions,
                isFormDisabled: isFormDisabled,
                pathToData: kind,
                subjects: sortedSubjects
            })
        ]
    });
};

export { ContentTypes };
//# sourceMappingURL=ContentTypes.mjs.map
