'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var collections = require('../../../constants/collections.js');
var strings = require('../../../utils/strings.js');
var translations = require('../../../utils/translations.js');

const Header = ({ name })=>{
    const { formatMessage } = reactIntl.useIntl();
    const params = reactRouterDom.useParams();
    const modified = strapiAdmin.useForm('Header', (state)=>state.modified);
    const isSubmitting = strapiAdmin.useForm('Header', (state)=>state.isSubmitting);
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
        navigationAction: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.BackButton, {
            fallback: `../${collections.COLLECTION_TYPES}/${params.slug}`
        }),
        primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            size: "S",
            disabled: !modified,
            type: "submit",
            loading: isSubmitting,
            children: formatMessage({
                id: 'global.save',
                defaultMessage: 'Save'
            })
        }),
        subtitle: formatMessage({
            id: translations.getTranslation('components.SettingsViewWrapper.pluginHeader.description.list-settings'),
            defaultMessage: 'Define the settings of the list view.'
        }),
        title: formatMessage({
            id: translations.getTranslation('components.SettingsViewWrapper.pluginHeader.title'),
            defaultMessage: 'Configure the view - {name}'
        }, {
            name: strings.capitalise(name)
        })
    });
};

exports.Header = Header;
//# sourceMappingURL=Header.js.map
