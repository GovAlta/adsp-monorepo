'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var collections = require('../../constants/collections.js');
var useDocument = require('../../hooks/useDocument.js');
var useDocumentLayout = require('../../hooks/useDocumentLayout.js');
var hooks = require('../../modules/hooks.js');
var contentTypes = require('../../services/contentTypes.js');
var objects = require('../../utils/objects.js');
var Header = require('./components/Header.js');
var Settings = require('./components/Settings.js');
var SortDisplayedFields = require('./components/SortDisplayedFields.js');

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

const ListConfiguration = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { model, collectionType } = useDocument.useDoc();
    const { isLoading: isLoadingLayout, list, edit } = useDocumentLayout.useDocLayout();
    const [updateContentTypeConfiguration] = contentTypes.useUpdateContentTypeConfigurationMutation();
    const handleSubmit = async (data)=>{
        try {
            trackUsage('willSaveContentTypeLayout');
            const layoutData = data.layout ?? [];
            /**
       * We reconstruct the metadatas object by taking the existing edit metadatas
       * and re-merging that by attribute name with the current list metadatas, whilst overwriting
       * the data from the form we've built.
       */ const meta = Object.entries(edit.metadatas).reduce((acc, [name, editMeta])=>{
                const { mainField: _mainField, ...listMeta } = list.metadatas[name];
                const { label, sortable } = layoutData.find((field)=>field.name === name) ?? {};
                acc[name] = {
                    edit: editMeta,
                    list: {
                        ...listMeta,
                        label: label || listMeta.label,
                        sortable: sortable || listMeta.sortable
                    }
                };
                return acc;
            }, {});
            const res = await updateContentTypeConfiguration({
                layouts: {
                    edit: edit.layout.flatMap((panel)=>panel.map((row)=>row.map(({ name, size })=>({
                                    name,
                                    size
                                })))),
                    list: layoutData.map((field)=>field.name)
                },
                settings: objects.setIn(data.settings, 'displayName', undefined),
                metadatas: meta,
                uid: model
            });
            if ('data' in res) {
                trackUsage('didEditListSettings');
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
        } catch (err) {
            console.error(err);
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const initialValues = React__namespace.useMemo(()=>{
        return {
            layout: list.layout.map(({ label, sortable, name })=>({
                    label: typeof label === 'string' ? label : formatMessage(label),
                    sortable,
                    name
                })),
            settings: list.settings
        };
    }, [
        formatMessage,
        list.layout,
        list.settings
    ]);
    if (collectionType === collections.SINGLE_TYPES) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: `/single-types/${model}`
        });
    }
    if (isLoadingLayout) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Layouts.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Title, {
                children: `Configure ${list.settings.displayName} List View`
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Main, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Form, {
                    initialValues: initialValues,
                    onSubmit: handleSubmit,
                    method: "PUT",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(Header.Header, {
                            collectionType: collectionType,
                            model: model,
                            name: list.settings.displayName ?? ''
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                alignItems: "stretch",
                                background: "neutral0",
                                direction: "column",
                                gap: 6,
                                hasRadius: true,
                                shadow: "tableShadow",
                                paddingTop: 6,
                                paddingBottom: 6,
                                paddingLeft: 7,
                                paddingRight: 7,
                                position: "relative",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(Settings.Settings, {}),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {}),
                                    /*#__PURE__*/ jsxRuntime.jsx(SortDisplayedFields.SortDisplayedFields, {})
                                ]
                            })
                        })
                    ]
                })
            })
        ]
    });
};
const ProtectedListConfiguration = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.contentManager?.collectionTypesConfigurations);
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ListConfiguration, {})
    });
};

exports.ListConfiguration = ListConfiguration;
exports.ProtectedListConfiguration = ProtectedListConfiguration;
//# sourceMappingURL=ListConfigurationPage.js.map
