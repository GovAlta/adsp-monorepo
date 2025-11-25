'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var CollapsableContentType = require('./CollapsableContentType.js');

const ContentTypesSection = ({ section = null, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Root, {
            size: "M",
            children: section && section.map((api, index)=>/*#__PURE__*/ jsxRuntime.jsx(CollapsableContentType.CollapsableContentType, {
                    label: api.label,
                    controllers: api.controllers,
                    orderNumber: index,
                    ...props
                }, api.apiId))
        })
    });
};

exports.ContentTypesSection = ContentTypesSection;
//# sourceMappingURL=ContentTypesSection.js.map
