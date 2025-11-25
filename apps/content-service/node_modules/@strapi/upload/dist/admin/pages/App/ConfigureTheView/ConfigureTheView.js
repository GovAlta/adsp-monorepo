'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var isEqual = require('lodash/isEqual');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var useConfig = require('../../../hooks/useConfig.js');
var pluginId = require('../../../pluginId.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
require('../../../utils/urlYupSchema.js');
var Settings = require('./components/Settings.js');
var actions = require('./state/actions.js');
var init = require('./state/init.js');
var reducer = require('./state/reducer.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

// TODO: find a better naming convention for the file that was an index file before
const ConfigureTheView = ({ config })=>{
    const { trackUsage } = strapiAdmin.useTracking();
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { mutateConfig } = useConfig.useConfig();
    const { isLoading: isSubmittingForm } = mutateConfig;
    const [showWarningSubmit, setWarningSubmit] = React__namespace.useState(false);
    const toggleWarningSubmit = ()=>setWarningSubmit((prevState)=>!prevState);
    const [reducerState, dispatch] = React__namespace.useReducer(reducer.reducer, init.initialState, ()=>init.init(config));
    const typedDispatch = dispatch;
    const { initialData, modifiedData } = reducerState;
    const handleSubmit = (e)=>{
        e.preventDefault();
        toggleWarningSubmit();
    };
    const handleConfirm = async ()=>{
        trackUsage('willEditMediaLibraryConfig');
        await mutateConfig.mutateAsync(modifiedData);
        setWarningSubmit(false);
        typedDispatch(actions.setLoaded());
        toggleNotification({
            type: 'success',
            message: formatMessage({
                id: 'notification.form.success.fields',
                defaultMessage: 'Changes saved'
            })
        });
    };
    const handleChange = ({ target: { name, value } })=>{
        typedDispatch(actions.onChange({
            name,
            value
        }));
    };
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Root, {
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Main, {
            "aria-busy": isSubmittingForm,
            children: /*#__PURE__*/ jsxRuntime.jsxs("form", {
                onSubmit: handleSubmit,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
                        navigationAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            tag: reactRouterDom.NavLink,
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ArrowLeft, {}),
                            to: `/plugins/${pluginId.pluginId}`,
                            id: "go-back",
                            children: formatMessage({
                                id: getTrad.getTrad('config.back'),
                                defaultMessage: 'Back'
                            })
                        }),
                        primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            size: "S",
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                            disabled: isEqual(modifiedData, initialData),
                            type: "submit",
                            children: formatMessage({
                                id: 'global.save',
                                defaultMessage: 'Save'
                            })
                        }),
                        subtitle: formatMessage({
                            id: getTrad.getTrad('config.subtitle'),
                            defaultMessage: 'Define the view settings of the media library.'
                        }),
                        title: formatMessage({
                            id: getTrad.getTrad('config.title'),
                            defaultMessage: 'Configure the view - Media Library'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(Settings.Settings, {
                            "data-testid": "settings",
                            pageSize: modifiedData.pageSize || '',
                            sort: modifiedData.sort || '',
                            onChange: handleChange
                        })
                    }),
                    "x",
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                        open: showWarningSubmit,
                        onOpenChange: toggleWarningSubmit,
                        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                            onConfirm: handleConfirm,
                            variant: "default",
                            children: formatMessage({
                                id: getTrad.getTrad('config.popUpWarning.warning.updateAllSettings'),
                                defaultMessage: 'This will modify all your settings'
                            })
                        })
                    })
                ]
            })
        })
    });
};

exports.ConfigureTheView = ConfigureTheView;
//# sourceMappingURL=ConfigureTheView.js.map
