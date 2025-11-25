'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var ContentTypeCollapses = require('./ContentTypeCollapses.js');
var GlobalActions = require('./GlobalActions.js');

const ContentTypes = ({ isFormDisabled, kind, layout: { actions, subjects } })=>{
    const sortedSubjects = [
        ...subjects
    ].sort((a, b)=>a.label.localeCompare(b.label));
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        background: "neutral0",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(GlobalActions.GlobalActions, {
                actions: actions,
                kind: kind,
                isFormDisabled: isFormDisabled
            }),
            /*#__PURE__*/ jsxRuntime.jsx(ContentTypeCollapses.ContentTypeCollapses, {
                actions: actions,
                isFormDisabled: isFormDisabled,
                pathToData: kind,
                subjects: sortedSubjects
            })
        ]
    });
};

exports.ContentTypes = ContentTypes;
//# sourceMappingURL=ContentTypes.js.map
