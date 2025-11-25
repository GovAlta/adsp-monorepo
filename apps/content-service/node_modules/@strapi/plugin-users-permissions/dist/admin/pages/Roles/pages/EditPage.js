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

const EditPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = admin.useNotification();
    const { params: { id } } = reactRouterDom.useMatch(`/settings/users-permissions/roles/:id`);
    const { get } = admin.useFetchClient();
    const { isLoading: isLoadingPlugins, routes } = usePlugins.usePlugins();
    const { data: role, isLoading: isLoadingRole, refetch: refetchRole } = reactQuery.useQuery([
        'users-permissions',
        'role',
        id
    ], async ()=>{
        // TODO: why doesn't this endpoint follow the admin API conventions?
        const { data: { role } } = await get(`/users-permissions/roles/${id}`);
        return role;
    });
    const permissionsRef = React__namespace.useRef();
    const { put } = admin.useFetchClient();
    const { formatAPIError } = admin.useAPIErrorHandler();
    const mutation = reactQuery.useMutation((body)=>put(`/users-permissions/roles/${id}`, body), {
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        },
        async onSuccess () {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad('Settings.roles.created'),
                    defaultMessage: 'Role edited'
                })
            });
            await refetchRole();
        }
    });
    const handleEditRoleSubmit = async (data)=>{
        const permissions = permissionsRef.current.getPermissions();
        await mutation.mutate({
            ...data,
            ...permissions,
            users: []
        });
    };
    if (isLoadingRole) {
        return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Loading, {});
    }
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
                    name: role.name,
                    description: role.description
                },
                onSubmit: handleEditRoleSubmit,
                validationSchema: constants$1.createRoleSchema,
                children: ({ handleSubmit, values, handleChange, errors })=>/*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                        noValidate: true,
                        onSubmit: handleSubmit,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Header, {
                                primaryAction: !isLoadingPlugins ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    disabled: role.code === 'strapi-super-admin',
                                    type: "submit",
                                    loading: mutation.isLoading,
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                }) : null,
                                title: role.name,
                                subtitle: role.description,
                                navigationAction: /*#__PURE__*/ jsxRuntime.jsx(admin.BackButton, {
                                    fallback: ".."
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
                                            gap: 4,
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
                                            permissions: role.permissions,
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
const ProtectedRolesEditPage = ()=>/*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.updateRole,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditPage, {})
    });

exports.EditPage = EditPage;
exports.ProtectedRolesEditPage = ProtectedRolesEditPage;
//# sourceMappingURL=EditPage.js.map
