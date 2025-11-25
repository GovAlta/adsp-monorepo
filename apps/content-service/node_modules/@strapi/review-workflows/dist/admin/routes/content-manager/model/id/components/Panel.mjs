import { jsxs, jsx } from 'react/jsx-runtime';
import { unstable_useDocumentLayout } from '@strapi/content-manager/strapi-admin';
import { Flex } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { AssigneeSelect } from './AssigneeSelect.mjs';
import { StageSelect } from './StageSelect.mjs';

const Panel = ()=>{
    const { slug = '', id, collectionType } = useParams();
    const { edit: { options } } = unstable_useDocumentLayout(slug);
    const { formatMessage } = useIntl();
    if (!window.strapi.isEE || !options?.reviewWorkflows || collectionType !== 'single-types' && !id || id === 'create') {
        return null;
    }
    return {
        title: formatMessage({
            id: 'content-manager.containers.edit.panels.review-workflows.title',
            defaultMessage: 'Review Workflows'
        }),
        content: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            gap: 2,
            alignItems: "stretch",
            width: "100%",
            children: [
                /*#__PURE__*/ jsx(AssigneeSelect, {}),
                /*#__PURE__*/ jsx(StageSelect, {})
            ]
        })
    };
};
// @ts-expect-error – this is fine, we like to label the core panels / actions.
Panel.type = 'review-workflows';

export { Panel };
//# sourceMappingURL=Panel.mjs.map
