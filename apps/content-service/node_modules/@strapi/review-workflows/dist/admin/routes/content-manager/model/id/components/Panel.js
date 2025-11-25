'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var AssigneeSelect = require('./AssigneeSelect.js');
var StageSelect = require('./StageSelect.js');

const Panel = ()=>{
    const { slug = '', id, collectionType } = reactRouterDom.useParams();
    const { edit: { options } } = strapiAdmin.unstable_useDocumentLayout(slug);
    const { formatMessage } = reactIntl.useIntl();
    if (!window.strapi.isEE || !options?.reviewWorkflows || collectionType !== 'single-types' && !id || id === 'create') {
        return null;
    }
    return {
        title: formatMessage({
            id: 'content-manager.containers.edit.panels.review-workflows.title',
            defaultMessage: 'Review Workflows'
        }),
        content: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            gap: 2,
            alignItems: "stretch",
            width: "100%",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(AssigneeSelect.AssigneeSelect, {}),
                /*#__PURE__*/ jsxRuntime.jsx(StageSelect.StageSelect, {})
            ]
        })
    };
};
// @ts-expect-error – this is fine, we like to label the core panels / actions.
Panel.type = 'review-workflows';

exports.Panel = Panel;
//# sourceMappingURL=Panel.js.map
