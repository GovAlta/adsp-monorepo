'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var Icons = require('@strapi/icons');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');

const HistoryAction = ({ model, document })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }] = strapiAdmin.useQueryParams();
    const navigate = reactRouterDom.useNavigate();
    const { trackUsage } = strapiAdmin.useTracking();
    const { pathname } = reactRouterDom.useLocation();
    const pluginsQueryParams = qs.stringify({
        plugins: query.plugins
    }, {
        encode: false
    });
    if (!window.strapi.features.isEnabled('cms-content-history')) {
        return null;
    }
    const handleOnClick = ()=>{
        const destination = {
            pathname: 'history',
            search: pluginsQueryParams
        };
        trackUsage('willNavigate', {
            from: pathname,
            to: `${pathname}/${destination.pathname}`
        });
        navigate(destination);
    };
    return {
        icon: /*#__PURE__*/ jsxRuntime.jsx(Icons.ClockCounterClockwise, {}),
        label: formatMessage({
            id: 'content-manager.history.document-action',
            defaultMessage: 'Content History'
        }),
        onClick: handleOnClick,
        disabled: /**
       * The user is creating a new document.
       * It hasn't been saved yet, so there's no history to go to
       */ !document || /**
       * The document has been created but the current dimension has never been saved.
       * For example, the user is creating a new locale in an existing document,
       * so there's no history for the document in that locale
       */ !document.id || /**
       * History is only available for content types created by the user.
       * These have the `api::` prefix, as opposed to the ones created by Strapi or plugins,
       * which start with `admin::` or `plugin::`
       */ !model.startsWith('api::'),
        position: 'header'
    };
};
HistoryAction.type = 'history';
HistoryAction.position = 'header';

exports.HistoryAction = HistoryAction;
//# sourceMappingURL=HistoryAction.js.map
