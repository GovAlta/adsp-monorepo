'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
require('../../../constants.js');
var urlsToAssets = require('../../../utils/urlsToAssets.js');
var urlYupSchema = require('../../../utils/urlYupSchema.js');

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

const FromUrlForm = ({ onClose, onAddAsset, trackedLocation })=>{
    const [loading, setLoading] = React__namespace.useState(false);
    const [error, setError] = React__namespace.useState(undefined);
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const handleSubmit = async ({ urls })=>{
        setLoading(true);
        const urlArray = urls.split(/\r?\n/);
        try {
            const assets = await urlsToAssets.urlsToAssets(urlArray);
            if (trackedLocation) {
                trackUsage('didSelectFile', {
                    source: 'url',
                    location: trackedLocation
                });
            }
            // no need to set the loading to false since the component unmounts
            onAddAsset(assets);
        } catch (e) {
            setError(e);
            setLoading(false);
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
        enableReinitialize: true,
        initialValues: {
            urls: ''
        },
        onSubmit: handleSubmit,
        validationSchema: urlYupSchema.urlSchema,
        validateOnChange: false,
        children: ({ values, errors, handleChange })=>/*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                noValidate: true,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingBottom: 6,
                        paddingTop: 6,
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                            hint: formatMessage({
                                id: getTrad.getTrad('input.url.description'),
                                defaultMessage: 'Separate your URL links by a carriage return.'
                            }),
                            error: error?.message || (errors.urls ? formatMessage({
                                id: errors.urls,
                                defaultMessage: 'An error occured'
                            }) : undefined),
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                    children: formatMessage({
                                        id: getTrad.getTrad('input.url.label'),
                                        defaultMessage: 'URL'
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Textarea, {
                                    name: "urls",
                                    onChange: handleChange,
                                    value: values.urls
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                onClick: onClose,
                                variant: "tertiary",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'cancel'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                type: "submit",
                                loading: loading,
                                children: formatMessage({
                                    id: getTrad.getTrad('button.next'),
                                    defaultMessage: 'Next'
                                })
                            })
                        ]
                    })
                ]
            })
    });
};

exports.FromUrlForm = FromUrlForm;
//# sourceMappingURL=FromUrlForm.js.map
