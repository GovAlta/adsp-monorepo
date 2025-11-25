'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var translations = require('../utils/translations.js');

const NoPermissions = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
                title: formatMessage({
                    id: translations.getTranslation('header.name'),
                    defaultMessage: 'Content'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.NoPermissions, {})
            })
        ]
    });
};

exports.NoPermissions = NoPermissions;
//# sourceMappingURL=NoPermissionsPage.js.map
