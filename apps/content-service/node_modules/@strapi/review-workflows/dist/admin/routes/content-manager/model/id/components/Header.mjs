import { jsxs, jsx } from 'react/jsx-runtime';
import { unstable_useDocumentLayout } from '@strapi/content-manager/strapi-admin';
import { Flex } from '@strapi/design-system';
import { useParams } from 'react-router-dom';
import { AssigneeSelect } from './AssigneeSelect.mjs';
import { StageSelect } from './StageSelect.mjs';

const Header = ()=>{
    const { slug = '', id, collectionType } = useParams();
    const { edit: { options } } = unstable_useDocumentLayout(slug);
    if (!window.strapi.isEE || !options?.reviewWorkflows || collectionType !== 'single-types' && !id || id === 'create') {
        return null;
    }
    return /*#__PURE__*/ jsxs(Flex, {
        gap: 2,
        children: [
            /*#__PURE__*/ jsx(AssigneeSelect, {
                isCompact: true
            }),
            /*#__PURE__*/ jsx(StageSelect, {
                isCompact: true
            })
        ]
    });
};
Header.type = 'preview';

export { Header };
//# sourceMappingURL=Header.mjs.map
