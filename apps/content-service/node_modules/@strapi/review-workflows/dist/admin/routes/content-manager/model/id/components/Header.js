'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactRouterDom = require('react-router-dom');
var AssigneeSelect = require('./AssigneeSelect.js');
var StageSelect = require('./StageSelect.js');

const Header = ()=>{
    const { slug = '', id, collectionType } = reactRouterDom.useParams();
    const { edit: { options } } = strapiAdmin.unstable_useDocumentLayout(slug);
    if (!window.strapi.isEE || !options?.reviewWorkflows || collectionType !== 'single-types' && !id || id === 'create') {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(AssigneeSelect.AssigneeSelect, {
                isCompact: true
            }),
            /*#__PURE__*/ jsxRuntime.jsx(StageSelect.StageSelect, {
                isCompact: true
            })
        ]
    });
};
Header.type = 'preview';

exports.Header = Header;
//# sourceMappingURL=Header.js.map
