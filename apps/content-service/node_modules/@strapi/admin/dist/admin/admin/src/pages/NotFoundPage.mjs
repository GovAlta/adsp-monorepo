import { jsxs, jsx } from 'react/jsx-runtime';
import { EmptyStateLayout, LinkButton } from '@strapi/design-system';
import { ArrowRight } from '@strapi/icons';
import { EmptyPictures } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Layouts } from '../components/Layouts/Layout.mjs';
import { Page } from '../components/PageHelpers.mjs';

const NotFoundPage = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Page.Main, {
        labelledBy: "title",
        children: [
            /*#__PURE__*/ jsx(Layouts.Header, {
                id: "title",
                title: formatMessage({
                    id: 'content-manager.pageNotFound',
                    defaultMessage: 'Page not found'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Content, {
                children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                    action: /*#__PURE__*/ jsx(LinkButton, {
                        tag: Link,
                        variant: "secondary",
                        endIcon: /*#__PURE__*/ jsx(ArrowRight, {}),
                        to: "/",
                        children: formatMessage({
                            id: 'app.components.NotFoundPage.back',
                            defaultMessage: 'Back to homepage'
                        })
                    }),
                    content: formatMessage({
                        id: 'app.page.not.found',
                        defaultMessage: "Oops! We can't seem to find the page you're looging for..."
                    }),
                    hasRadius: true,
                    icon: /*#__PURE__*/ jsx(EmptyPictures, {
                        width: "16rem"
                    }),
                    shadow: "tableShadow"
                })
            })
        ]
    });
};

export { NotFoundPage };
//# sourceMappingURL=NotFoundPage.mjs.map
