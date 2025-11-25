import { jsx } from 'react/jsx-runtime';
import { LinkButton } from '@strapi/design-system';
import { Upload } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Layouts } from '../../../components/Layouts/Layout.mjs';
import { useTracking } from '../../../features/Tracking.mjs';

const PageHeader = ({ isOnline, npmPackageType = 'plugin' })=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const tracking = npmPackageType === 'provider' ? 'didSubmitProvider' : 'didSubmitPlugin';
    return /*#__PURE__*/ jsx(Layouts.Header, {
        title: formatMessage({
            id: 'global.marketplace',
            defaultMessage: 'Marketplace'
        }),
        subtitle: formatMessage({
            id: 'admin.pages.MarketPlacePage.subtitle',
            defaultMessage: 'Get more out of Strapi'
        }),
        primaryAction: isOnline && /*#__PURE__*/ jsx(LinkButton, {
            startIcon: /*#__PURE__*/ jsx(Upload, {}),
            variant: "tertiary",
            href: `https://market.strapi.io/submit-${npmPackageType}`,
            onClick: ()=>trackUsage(tracking),
            isExternal: true,
            children: formatMessage({
                id: `admin.pages.MarketPlacePage.submit.${npmPackageType}.link`,
                defaultMessage: `Submit ${npmPackageType}`
            })
        })
    });
};

export { PageHeader };
//# sourceMappingURL=PageHeader.mjs.map
