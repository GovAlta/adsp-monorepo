import { jsx } from 'react/jsx-runtime';
import { Box, Accordion } from '@strapi/design-system';
import { CollapsableContentType } from './CollapsableContentType.mjs';

const ContentTypesSection = ({ section = null, ...props })=>{
    return /*#__PURE__*/ jsx(Box, {
        children: /*#__PURE__*/ jsx(Accordion.Root, {
            size: "M",
            children: section && section.map((api, index)=>/*#__PURE__*/ jsx(CollapsableContentType, {
                    label: api.label,
                    controllers: api.controllers,
                    orderNumber: index,
                    ...props
                }, api.apiId))
        })
    });
};

export { ContentTypesSection };
//# sourceMappingURL=ContentTypesSection.mjs.map
