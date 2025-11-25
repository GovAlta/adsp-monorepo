import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { Layouts, Page } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { getTranslation } from '../utils/translations.mjs';

const NoPermissions = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Layouts.Header, {
                title: formatMessage({
                    id: getTranslation('header.name'),
                    defaultMessage: 'Content'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Content, {
                children: /*#__PURE__*/ jsx(Page.NoPermissions, {})
            })
        ]
    });
};

export { NoPermissions };
//# sourceMappingURL=NoPermissionsPage.mjs.map
