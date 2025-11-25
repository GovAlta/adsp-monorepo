import { jsxs, jsx } from 'react/jsx-runtime';
import { Page, Layouts } from '@strapi/admin/strapi-admin';
import { EmptyStateLayout, LinkButton } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { getTranslation } from '../utils/translations.mjs';

const NoContentType = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Page.Main, {
        children: [
            /*#__PURE__*/ jsx(Layouts.Header, {
                title: formatMessage({
                    id: getTranslation('header.name'),
                    defaultMessage: 'Content'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Content, {
                children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                    action: /*#__PURE__*/ jsx(LinkButton, {
                        tag: NavLink,
                        variant: "secondary",
                        startIcon: /*#__PURE__*/ jsx(Plus, {}),
                        to: "/plugins/content-type-builder/content-types/create-content-type",
                        children: formatMessage({
                            id: 'app.components.HomePage.create',
                            defaultMessage: 'Create your first Content-type'
                        })
                    }),
                    content: formatMessage({
                        id: 'content-manager.pages.NoContentType.text',
                        defaultMessage: "You don't have any content yet, we recommend you to create your first Content-Type."
                    }),
                    hasRadius: true,
                    icon: /*#__PURE__*/ jsx(EmptyDocuments, {
                        width: "16rem"
                    }),
                    shadow: "tableShadow"
                })
            })
        ]
    });
};

export { NoContentType };
//# sourceMappingURL=NoContentTypePage.mjs.map
