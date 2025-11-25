'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Fields = require('../components/ConfigurationForm/Fields.js');
var Form = require('../components/ConfigurationForm/Form.js');
var useContentTypeSchema = require('../hooks/useContentTypeSchema.js');
var useDocumentLayout = require('../hooks/useDocumentLayout.js');
var hooks = require('../modules/hooks.js');
var components = require('../services/components.js');
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

/* -------------------------------------------------------------------------------------------------
 * ComponentConfigurationPage
 * -----------------------------------------------------------------------------------------------*/ const ComponentConfigurationPage = ()=>{
    /**
   * useDocumentLayout only works for documents, not components,
   * it feels weird to make that hook work for both when this is SUCH
   * a unique use case and we only do it here, so in short, we essentially
   * just extracted the logic to make an edit view layout and reproduced it here.
   */ const { slug: model } = reactRouterDom.useParams();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { components: components$1, fieldSizes, schema, error: errorSchema, isLoading: isLoadingSchema, isFetching: isFetchingSchema } = init.useGetInitialDataQuery(undefined, {
        selectFromResult: (res)=>{
            const schema = res.data?.components.find((ct)=>ct.uid === model);
            const componentsByKey = res.data?.components.reduce((acc, component)=>{
                acc[component.uid] = component;
                return acc;
            }, {});
            const components = useContentTypeSchema.extractContentTypeComponents(schema?.attributes, componentsByKey);
            const fieldSizes = Object.entries(res.data?.fieldSizes ?? {}).reduce((acc, [attributeName, { default: size }])=>{
                acc[attributeName] = size;
                return acc;
            }, {});
            return {
                isFetching: res.isFetching,
                isLoading: res.isLoading,
                error: res.error,
                components,
                schema,
                fieldSizes
            };
        }
    });
    React__namespace.useEffect(()=>{
        if (errorSchema) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(errorSchema)
            });
        }
    }, [
        errorSchema,
        formatAPIError,
        toggleNotification
    ]);
    const { data, isLoading: isLoadingConfig, isFetching: isFetchingConfig, error } = components.useGetComponentConfigurationQuery(model ?? '');
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    /**
   * you **must** check if we're loading or fetching in case the component gets new props
   * but nothing was unmounted, it then becomes a fetch, not a load.
   */ const isLoading = isLoadingConfig || isLoadingSchema || isFetchingConfig || isFetchingSchema;
    const editLayout = React__namespace.useMemo(()=>data && !isLoading ? formatEditLayout(data, {
            schema,
            components: components$1
        }) : {
            layout: [],
            components: {},
            metadatas: {},
            options: {},
            settings: useDocumentLayout.DEFAULT_SETTINGS
        }, [
        data,
        isLoading,
        schema,
        components$1
    ]);
    const [updateConfiguration] = components.useUpdateComponentConfigurationMutation();
    const handleSubmit = async (formData)=>{
        try {
            /**
       * We reconstruct the metadatas object by taking the existing list metadatas
       * and re-merging that by attribute name with the current list metadatas, whilst overwriting
       * the data from the form we've built.
       */ const meta = Object.entries(data?.component.metadatas ?? {}).reduce((acc, [name, { edit, list }])=>{
                const { __temp_key__, size: _size, name: _name, ...editedMetadata } = formData.layout.flatMap((row)=>row.children).find((field)=>field.name === name) ?? {};
                acc[name] = {
                    edit: {
                        ...edit,
                        ...editedMetadata
                    },
                    list
                };
                return acc;
            }, {});
            const res = await updateConfiguration({
                layouts: {
                    edit: formData.layout.map((row)=>row.children.reduce((acc, { name, size })=>{
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
                    list: data?.component.layouts.list
                },
                settings: objects.setIn(formData.settings, 'displayName', undefined),
                metadatas: meta,
                uid: model
            });
            if ('data' in res) {
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
    if (error || errorSchema || !schema) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Error, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Title, {
                children: `Configure ${editLayout.settings.displayName} Edit View`
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Form.ConfigurationForm, {
                onSubmit: handleSubmit,
                attributes: schema.attributes,
                fieldSizes: fieldSizes,
                layout: editLayout
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/ const formatEditLayout = (data, { schema, components })=>{
    const editAttributes = useDocumentLayout.convertEditLayoutToFieldLayouts(data.component.layouts.edit, schema?.attributes, data.component.metadatas, {
        configurations: data.components,
        schemas: components
    });
    const componentEditAttributes = Object.entries(data.components).reduce((acc, [uid, configuration])=>{
        acc[uid] = {
            layout: useDocumentLayout.convertEditLayoutToFieldLayouts(configuration.layouts.edit, components[uid].attributes, configuration.metadatas),
            settings: {
                ...configuration.settings,
                icon: components[uid].info.icon,
                displayName: components[uid].info.displayName
            }
        };
        return acc;
    }, {});
    const editMetadatas = Object.entries(data.component.metadatas).reduce((acc, [attribute, metadata])=>{
        return {
            ...acc,
            [attribute]: metadata.edit
        };
    }, {});
    return {
        layout: [
            editAttributes
        ],
        components: componentEditAttributes,
        metadatas: editMetadatas,
        options: {
            ...schema?.options,
            ...schema?.pluginOptions
        },
        settings: {
            ...data.component.settings,
            displayName: schema?.info.displayName
        }
    };
};
/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/ const ProtectedComponentConfigurationPage = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.contentManager?.componentsConfigurations);
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(ComponentConfigurationPage, {})
    });
};

exports.ComponentConfigurationPage = ComponentConfigurationPage;
exports.ProtectedComponentConfigurationPage = ProtectedComponentConfigurationPage;
//# sourceMappingURL=ComponentConfigurationPage.js.map
