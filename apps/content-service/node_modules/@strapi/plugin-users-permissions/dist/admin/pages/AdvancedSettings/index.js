'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var admin = require('@strapi/strapi/admin');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var constants = require('../../constants.js');
require('lodash/isEmpty');
var getTrad = require('../../utils/getTrad.js');
var layout = require('./utils/layout.js');
var schema = require('./utils/schema.js');

const ProtectedAdvancedSettingsPage = ()=>/*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.readAdvancedSettings,
        children: /*#__PURE__*/ jsxRuntime.jsx(AdvancedSettingsPage, {})
    });
const AdvancedSettingsPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = admin.useNotification();
    const { notifyStatus } = designSystem.useNotifyAT();
    const queryClient = reactQuery.useQueryClient();
    const { get, put } = admin.useFetchClient();
    const { formatAPIError } = admin.useAPIErrorHandler();
    const { isLoading: isLoadingForPermissions, allowedActions: { canUpdate } } = admin.useRBAC({
        update: constants.PERMISSIONS.updateAdvancedSettings
    });
    const { isLoading: isLoadingData, data } = reactQuery.useQuery([
        'users-permissions',
        'advanced'
    ], async ()=>{
        const { data } = await get('/users-permissions/advanced');
        return data;
    }, {
        onSuccess () {
            notifyStatus(formatMessage({
                id: getTrad('Form.advancedSettings.data.loaded'),
                defaultMessage: 'Advanced settings data has been loaded'
            }));
        },
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: getTrad('notification.error'),
                    defaultMessage: 'An error occured'
                })
            });
        }
    });
    const isLoading = isLoadingForPermissions || isLoadingData;
    const submitMutation = reactQuery.useMutation((body)=>put('/users-permissions/advanced', body), {
        async onSuccess () {
            await queryClient.invalidateQueries([
                'users-permissions',
                'advanced'
            ]);
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad('notification.success.saved'),
                    defaultMessage: 'Saved'
                })
            });
        },
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        },
        refetchActive: true
    });
    const { isLoading: isSubmittingForm } = submitMutation;
    const handleSubmit = async (body)=>{
        submitMutation.mutate({
            ...body,
            email_confirmation_redirection: body.email_confirmation ? body.email_confirmation_redirection : ''
        });
    };
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(admin.Page.Main, {
        "aria-busy": isSubmittingForm,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: formatMessage({
                        id: getTrad('HeaderNav.link.advancedSettings'),
                        defaultMessage: 'Advanced Settings'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(admin.Form, {
                onSubmit: handleSubmit,
                initialValues: data.settings,
                validationSchema: schema,
                children: ({ values, isSubmitting, modified })=>{
                    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Header, {
                                title: formatMessage({
                                    id: getTrad('HeaderNav.link.advancedSettings'),
                                    defaultMessage: 'Advanced Settings'
                                }),
                                primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    loading: isSubmitting,
                                    type: "submit",
                                    disabled: !modified || !canUpdate,
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                                    size: "S",
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(admin.Layouts.Content, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    background: "neutral0",
                                    hasRadius: true,
                                    shadow: "filterShadow",
                                    paddingTop: 6,
                                    paddingBottom: 6,
                                    paddingLeft: 7,
                                    paddingRight: 7,
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 4,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "delta",
                                                tag: "h2",
                                                children: formatMessage({
                                                    id: 'global.settings',
                                                    defaultMessage: 'Settings'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                                gap: 6,
                                                children: [
                                                    {
                                                        label: {
                                                            id: getTrad('EditForm.inputSelect.label.role'),
                                                            defaultMessage: 'Default role for authenticated users'
                                                        },
                                                        hint: {
                                                            id: getTrad('EditForm.inputSelect.description.role'),
                                                            defaultMessage: 'It will attach the new authenticated user to the selected role.'
                                                        },
                                                        options: data.roles.map((role)=>({
                                                                label: role.name,
                                                                value: role.type
                                                            })),
                                                        name: 'default_role',
                                                        size: 6,
                                                        type: 'enumeration'
                                                    },
                                                    ...layout
                                                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                        col: size,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(admin.InputRenderer, {
                                                            ...field,
                                                            disabled: field.name === 'email_confirmation_redirection' && values.email_confirmation === false,
                                                            label: formatMessage(field.label),
                                                            hint: field.hint ? formatMessage(field.hint) : undefined,
                                                            placeholder: field.placeholder ? formatMessage(field.placeholder) : undefined
                                                        })
                                                    }, field.name))
                                            })
                                        ]
                                    })
                                })
                            })
                        ]
                    });
                }
            })
        ]
    });
};

exports.AdvancedSettingsPage = AdvancedSettingsPage;
exports.ProtectedAdvancedSettingsPage = ProtectedAdvancedSettingsPage;
//# sourceMappingURL=index.js.map
