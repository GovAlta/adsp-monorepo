'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var Fields = require('../components/ConfigurationForm/Fields.js');
var Form = require('../components/ConfigurationForm/Form.js');
var useDocument = require('../hooks/useDocument.js');
var useDocumentLayout = require('../hooks/useDocumentLayout.js');
var hooks = require('../modules/hooks.js');
var contentTypes = require('../services/contentTypes.js');
var init = require('../services/init.js');
var objects = require('../utils/objects.js');

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

const EditConfigurationPage = ()=>{
    const { trackUsage } = strapiAdmin.useTracking();
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { isLoading: isLoadingSchema, schema, model } = useDocument.useDoc();
    const { isLoading: isLoadingLayout, error, list, edit } = useDocumentLayout.useDocLayout();
    const { fieldSizes, error: errorFieldSizes, isLoading: isLoadingFieldSizes, isFetching: isFetchingFieldSizes } = init.useGetInitialDataQuery(undefined, {
        selectFromResult: (res)=>{
            const fieldSizes = Object.entries(res.data?.fieldSizes ?? {}).reduce((acc, [attributeName, { default: size }])=>{
                acc[attributeName] = size;
                return acc;
            }, {});
            return {
                isFetching: res.isFetching,
                isLoading: res.isLoading,
                error: res.error,
                fieldSizes
            };
        }
    });
    React__namespace.useEffect(()=>{
        if (errorFieldSizes) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(errorFieldSizes)
            });
        }
    }, [
        errorFieldSizes,
        formatAPIError,
        toggleNotification
    ]);
    const isLoading = isLoadingSchema || isLoadingLayout || isLoadingFieldSizes || isFetchingFieldSizes;
    const [updateConfiguration] = contentTypes.useUpdateContentTypeConfigurationMutation();
    const handleSubmit = async (data)=>{
        try {
            trackUsage('willSaveContentTypeLayout');
            /**
       * We reconstruct the metadatas object by taking the existing list metadatas
       * and re-merging that by attribute name with the current list metadatas, whilst overwriting
       * the data from the form we've built.
       */ const meta = Object.entries(list.metadatas).reduce((acc, [name, { mainField: _mainField, ...listMeta }])=>{
                const existingEditMeta = edit.metadatas[name];
                const { __temp_key__, size: _size, name: _name, ...editedMetadata } = data.layout.flatMap((row)=>row.children).find((field)=>field.name === name) ?? {};
                acc[name] = {
                    edit: {
                        ...existingEditMeta,
                        ...editedMetadata
                    },
                    list: listMeta
                };
                return acc;
            }, {});
            const res = await updateConfiguration({
                layouts: {
                    edit: data.layout.map((row)=>row.children.reduce((acc, { name, size })=>{
                            if (name !== Fields.TEMP_FIELD_NAME) {
                                return [
                                    ...acc,
                                    {
                                        name,
                                        size
                                    }
                                ];
                            }
                            return acc;
                        }, [])),
                    list: list.layout.map((field)=>field.name)
                },
                settings: objects.setIn(data.settings, 'displayName', undefined),
                metadatas: meta,
                uid: model
            });
            if ('data' in res) {
                trackUsage('didEditEditSettings');
                toggleNotification({
                    type: 'success',
                    message: formatMessage({
                        id: 'notification.success.saved',
                        defaultMessage: 'Saved'
                    })
                });
            } else {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
            }
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    if (errorFieldSizes || error || !schema) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Error, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Title, {
                children: `Configure ${edit.settings.displayName} Edit View`
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Form.ConfigurationForm, {
                onSubmit: handleSubmit,
                attributes: schema.attributes,
                fieldSizes: fieldSizes,
                layout: edit
            })
        ]
    });
};
const ProtectedEditConfigurationPage = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.contentManager?.collectionTypesConfigurations);
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditConfigurationPage, {})
    });
};

exports.EditConfigurationPage = EditConfigurationPage;
exports.ProtectedEditConfigurationPage = ProtectedEditConfigurationPage;
//# sourceMappingURL=EditConfigurationPage.js.map
