'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var admin = require('@strapi/strapi/admin');
var formik = require('formik');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var reactRouterDom = require('react-router-dom');
var index = require('../../../components/UsersPermissions/index.js');
var constants = require('../../../constants.js');
var getTrad = require('../../../utils/getTrad.js');
var constants$1 = require('../constants.js');
var usePlugins = require('../hooks/usePlugins.js');

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

const CreatePage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = admin.useNotification();
    const navigate = reactRouterDom.useNavigate();
    const { isLoading: isLoadingPlugins, permissions, routes } = usePlugins.usePlugins();
    const { trackUsage } = admin.useTracking();
    const permissionsRef = React__namespace.useRef();
    const { post } = admin.useFetchClient();
    const mutation = reactQuery.useMutation((body)=>post(`/users-permissions/roles`, body), {
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        },
        onSuccess () {
            trackUsage('didCreateRole');
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad('Settings.roles.created'),
                    defaultMessage: 'Role created'
                })
            });
            // Forcing redirecting since we don't have the id in the response
            navigate(-1);
        }
    });
    const handleCreateRoleSubmit = async (data)=>{
        // TODO: refactor. Child -> parent component communication is evil;
        // We should either move the provider one level up or move the state
        // straight into redux.
        const permissions = permissionsRef.current.getPermissions();
        await mutation.mutate({
            ...data,
            ...permissions,
            users: []
        });
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Roles'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                enableReinitialize: true,
                initialValues: {
                    name: '',
                    description: ''
                },
                onSubmit: handleCreateRoleSubmit,
                validationSchema: constants$1.createRoleSchema,
                children: ({ handleSubmit, values, handleChange, errors })=>/*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                        noValidate: true,
                        onSubmit: handleSubmit,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Header, {
                                primaryAction: !isLoadingPlugins && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    type: "submit",
                                    loading: mutation.isLoading,
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                }),
                                title: formatMessage({
                                    id: 'Settings.roles.create.title',
                                    defaultMessage: 'Create a role'
                                }),
                                subtitle: formatMessage({
                                    id: 'Settings.roles.create.description',
                                    defaultMessage: 'Define the rights given to the role'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Content, {
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    background: "neutral0",
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 7,
                                    hasRadius: true,
                                    paddingTop: 6,
                                    paddingBottom: 6,
                                    paddingLeft: 7,
                                    paddingRight: 7,
                                    shadow: "filterShadow",
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                            direction: "column",
                                            alignItems: "stretch",
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    variant: "delta",
                                                    tag: "h2",
                                                    children: formatMessage({
                                                        id: getTrad('EditPage.form.roles'),
                                                        defaultMessage: 'Role details'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                                                    gap: 4,
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                            col: 6,
                                                            direction: "column",
                                                            alignItems: "stretch",
                                                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                                                name: "name",
                                                                error: errors?.name ? formatMessage({
                                                                    id: errors.name,
                                                                    defaultMessage: 'Name is required'
                                                                }) : false,
                                                                required: true,
                                                                children: [
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                                        children: formatMessage({
                                                                            id: 'global.name',
                                                                            defaultMessage: 'Name'
                                                                        })
                                                                    }),
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                                                                        value: values.name || '',
                                                                        onChange: handleChange
                                                                    }),
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                                                                ]
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                            col: 6,
                                                            direction: "column",
                                                            alignItems: "stretch",
                                                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                                                name: "description",
                                                                error: errors?.description ? formatMessage({
                                                                    id: errors.description,
                                                                    defaultMessage: 'Description is required'
                                                                }) : false,
                                                                required: true,
                                                                children: [
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                                        children: formatMessage({
                                                                            id: 'global.description',
                                                                            defaultMessage: 'Description'
                                                                        })
                                                                    }),
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Textarea, {
                                                                        value: values.description || '',
                                                                        onChange: handleChange
                                                                    }),
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                                                                ]
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        !isLoadingPlugins && /*#__PURE__*/ jsxRuntime.jsx(index, {
                                            ref: permissionsRef,
                                            permissions: permissions,
                                            routes: routes
                                        })
                                    ]
                                })
                            })
                        ]
                    })
            })
        ]
    });
};
const ProtectedRolesCreatePage = ()=>/*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.createRole,
        children: /*#__PURE__*/ jsxRuntime.jsx(CreatePage, {})
    });

exports.CreatePage = CreatePage;
exports.ProtectedRolesCreatePage = ProtectedRolesCreatePage;
//# sourceMappingURL=CreatePage.js.map
