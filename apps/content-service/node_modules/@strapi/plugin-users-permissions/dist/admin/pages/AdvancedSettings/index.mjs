import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import 'react';
import { useNotifyAT, Button, Box, Flex, Typography, Grid } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { Page, useNotification, useFetchClient, useAPIErrorHandler, useRBAC, Form, Layouts, InputRenderer } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import { PERMISSIONS } from '../../constants.mjs';
import 'lodash/isEmpty';
import getTrad from '../../utils/getTrad.mjs';
import layout from './utils/layout.mjs';
import schema from './utils/schema.mjs';

const ProtectedAdvancedSettingsPage = ()=>/*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.readAdvancedSettings,
        children: /*#__PURE__*/ jsx(AdvancedSettingsPage, {})
    });
const AdvancedSettingsPage = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { notifyStatus } = useNotifyAT();
    const queryClient = useQueryClient();
    const { get, put } = useFetchClient();
    const { formatAPIError } = useAPIErrorHandler();
    const { isLoading: isLoadingForPermissions, allowedActions: { canUpdate } } = useRBAC({
        update: PERMISSIONS.updateAdvancedSettings
    });
    const { isLoading: isLoadingData, data } = useQuery([
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
    const submitMutation = useMutation((body)=>put('/users-permissions/advanced', body), {
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        "aria-busy": isSubmittingForm,
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
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
            /*#__PURE__*/ jsx(Form, {
                onSubmit: handleSubmit,
                initialValues: data.settings,
                validationSchema: schema,
                children: ({ values, isSubmitting, modified })=>{
                    return /*#__PURE__*/ jsxs(Fragment, {
                        children: [
                            /*#__PURE__*/ jsx(Layouts.Header, {
                                title: formatMessage({
                                    id: getTrad('HeaderNav.link.advancedSettings'),
                                    defaultMessage: 'Advanced Settings'
                                }),
                                primaryAction: /*#__PURE__*/ jsx(Button, {
                                    loading: isSubmitting,
                                    type: "submit",
                                    disabled: !modified || !canUpdate,
                                    startIcon: /*#__PURE__*/ jsx(Check, {}),
                                    size: "S",
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Layouts.Content, {
                                children: /*#__PURE__*/ jsx(Box, {
                                    background: "neutral0",
                                    hasRadius: true,
                                    shadow: "filterShadow",
                                    paddingTop: 6,
                                    paddingBottom: 6,
                                    paddingLeft: 7,
                                    paddingRight: 7,
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 4,
                                        children: [
                                            /*#__PURE__*/ jsx(Typography, {
                                                variant: "delta",
                                                tag: "h2",
                                                children: formatMessage({
                                                    id: 'global.settings',
                                                    defaultMessage: 'Settings'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Grid.Root, {
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
                                                ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                                        col: size,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsx(InputRenderer, {
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

export { AdvancedSettingsPage, ProtectedAdvancedSettingsPage };
//# sourceMappingURL=index.mjs.map
