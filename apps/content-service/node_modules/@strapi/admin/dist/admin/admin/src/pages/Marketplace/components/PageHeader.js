'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var Layout = require('../../../components/Layouts/Layout.js');
var Tracking = require('../../../features/Tracking.js');

const PageHeader = ({ isOnline, npmPackageType = 'plugin' })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const tracking = npmPackageType === 'provider' ? 'didSubmitProvider' : 'didSubmitPlugin';
    return /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
        title: formatMessage({
            id: 'global.marketplace',
            defaultMessage: 'Marketplace'
        }),
        subtitle: formatMessage({
            id: 'admin.pages.MarketPlacePage.subtitle',
            defaultMessage: 'Get more out of Strapi'
        }),
        primaryAction: isOnline && /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Upload, {}),
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

exports.PageHeader = PageHeader;
//# sourceMappingURL=PageHeader.js.map
