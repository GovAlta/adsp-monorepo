import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Button, Flex, Typography, Grid, Field, MultiSelect, MultiSelectOption } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { Form, useField } from '../../../../../../admin/src/components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../../../../admin/src/components/FormInputs/Renderer.mjs';
import { GradientBadge as GradientBadgeWithIcon } from '../../../../../../admin/src/components/GradientBadge.mjs';
import { Layouts } from '../../../../../../admin/src/components/Layouts/Layout.mjs';
import { Page } from '../../../../../../admin/src/components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../../../admin/src/core/store/hooks.mjs';
import { useNotification } from '../../../../../../admin/src/features/Notifications.mjs';
import { useAdminRoles } from '../../../../../../admin/src/hooks/useAdminRoles.mjs';
import { useAPIErrorHandler } from '../../../../../../admin/src/hooks/useAPIErrorHandler.mjs';
import { useRBAC } from '../../../../../../admin/src/hooks/useRBAC.mjs';
import { useGetProviderOptionsQuery, useUpdateProviderOptionsMutation } from '../../../../../../admin/src/services/auth.mjs';
import { isBaseQueryError } from '../../../../../../admin/src/utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../../../../admin/src/utils/translatedErrors.mjs';

const SCHEMA = yup.object().shape({
    autoRegister: yup.bool().required(errorsTrads.required),
    defaultRole: yup.mixed().when('autoRegister', (value, initSchema)=>{
        return value ? initSchema.required(errorsTrads.required) : initSchema.nullable();
    }),
    ssoLockedRoles: yup.array().nullable().of(yup.mixed().when('ssoLockedRoles', (value, initSchema)=>{
        return value ? initSchema.required(errorsTrads.required) : initSchema.nullable();
    }))
});
const SingleSignOnPage = ()=>{
    const { formatMessage } = useIntl();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions);
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const { isLoading: isLoadingProviderOptions, data } = useGetProviderOptionsQuery();
    const [updateProviderOptions, { isLoading: isSubmittingForm }] = useUpdateProviderOptionsMutation();
    const { isLoading: isLoadingPermissions, allowedActions: { canUpdate, canRead: canReadRoles } } = useRBAC({
        ...permissions.settings?.sso,
        readRoles: permissions.settings?.roles.read ?? []
    });
    const { roles, isLoading: isLoadingRoles } = useAdminRoles(undefined, {
        skip: !canReadRoles
    });
    const handleSubmit = async (body, helpers)=>{
        try {
            const res = await updateProviderOptions(body);
            if ('error' in res) {
                if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                    helpers.setErrors(formatValidationErrors(res.error));
                } else {
                    toggleNotification({
                        type: 'danger',
                        message: formatAPIError(res.error)
                    });
                }
                return;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.success.saved'
                })
            });
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred, please try again.'
                })
            });
        }
    };
    const isLoadingData = isLoadingRoles || isLoadingPermissions || isLoadingProviderOptions;
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'SSO'
                })
            }),
            /*#__PURE__*/ jsx(Page.Main, {
                "aria-busy": isSubmittingForm || isLoadingData,
                tabIndex: -1,
                children: /*#__PURE__*/ jsx(Form, {
                    method: "PUT",
                    onSubmit: handleSubmit,
                    validationSchema: SCHEMA,
                    disabled: !canUpdate,
                    initialValues: data || {
                        autoRegister: false,
                        defaultRole: null,
                        ssoLockedRoles: null
                    },
                    children: ({ modified, isSubmitting })=>/*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Layouts.Header, {
                                    primaryAction: /*#__PURE__*/ jsx(Button, {
                                        disabled: !modified,
                                        loading: isSubmitting,
                                        startIcon: /*#__PURE__*/ jsx(Check, {}),
                                        type: "submit",
                                        children: formatMessage({
                                            id: 'global.save',
                                            defaultMessage: 'Save'
                                        })
                                    }),
                                    title: formatMessage({
                                        id: 'Settings.sso.title',
                                        defaultMessage: 'Single Sign-On'
                                    }),
                                    subtitle: formatMessage({
                                        id: 'Settings.sso.description',
                                        defaultMessage: 'Configure the settings for the Single Sign-On feature.'
                                    }),
                                    secondaryAction: /*#__PURE__*/ jsx(GradientBadgeWithIcon, {
                                        label: formatMessage({
                                            id: 'components.premiumFeature.title',
                                            defaultMessage: 'Premium feature'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Layouts.Content, {
                                    children: isSubmitting || isLoadingData ? /*#__PURE__*/ jsx(Page.Loading, {}) : /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 4,
                                        background: "neutral0",
                                        padding: 6,
                                        shadow: "filterShadow",
                                        hasRadius: true,
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
                                                gap: 4,
                                                children: [
                                                    {
                                                        hint: formatMessage({
                                                            id: 'Settings.sso.form.registration.description',
                                                            defaultMessage: 'Create new user on SSO login if no account exists'
                                                        }),
                                                        label: formatMessage({
                                                            id: 'Settings.sso.form.registration.label',
                                                            defaultMessage: 'Auto-registration'
                                                        }),
                                                        name: 'autoRegister',
                                                        size: 6,
                                                        type: 'boolean'
                                                    },
                                                    {
                                                        hint: formatMessage({
                                                            id: 'Settings.sso.form.defaultRole.description',
                                                            defaultMessage: 'It will attach the new authenticated user to the selected role'
                                                        }),
                                                        label: formatMessage({
                                                            id: 'Settings.sso.form.defaultRole.label',
                                                            defaultMessage: 'Default role'
                                                        }),
                                                        name: 'defaultRole',
                                                        options: roles.map(({ id, name })=>({
                                                                label: name,
                                                                value: id.toString()
                                                            })),
                                                        placeholder: formatMessage({
                                                            id: 'components.InputSelect.option.placeholder',
                                                            defaultMessage: 'Choose here'
                                                        }),
                                                        size: 6,
                                                        type: 'enumeration'
                                                    },
                                                    {
                                                        hint: formatMessage({
                                                            id: 'Settings.sso.form.localAuthenticationLock.description',
                                                            defaultMessage: 'Select the roles for which you want to disable the local authentication'
                                                        }),
                                                        label: formatMessage({
                                                            id: 'Settings.sso.form.localAuthenticationLock.label',
                                                            defaultMessage: 'Local authentication lock-out'
                                                        }),
                                                        name: 'ssoLockedRoles',
                                                        options: roles.map(({ id, name })=>({
                                                                label: name,
                                                                value: id.toString()
                                                            })),
                                                        placeholder: formatMessage({
                                                            id: 'components.InputSelect.option.placeholder',
                                                            defaultMessage: 'Choose here'
                                                        }),
                                                        size: 6,
                                                        type: 'multi'
                                                    }
                                                ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                                        col: size,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsx(FormInputRenderer, {
                                                            ...field
                                                        })
                                                    }, field.name))
                                            })
                                        ]
                                    })
                                })
                            ]
                        })
                })
            })
        ]
    });
};
const FormInputRenderer = (props)=>{
    switch(props.type){
        case 'multi':
            return /*#__PURE__*/ jsx(MultiSelectInput, {
                ...props
            });
        default:
            return /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                ...props
            });
    }
};
const MultiSelectInput = ({ hint, label, name, options, ...props })=>{
    const field = useField(name);
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: name,
        hint: hint,
        error: field.error,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(MultiSelect, {
                onChange: (value)=>field.onChange('ssoLockedRoles', value),
                onClear: ()=>field.onChange('ssoLockedRoles', []),
                value: field.value ?? [],
                withTags: true,
                ...props,
                children: options.map(({ label, value })=>/*#__PURE__*/ jsx(MultiSelectOption, {
                        value: value,
                        children: label
                    }, value))
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};
const ProtectedSSO = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.sso?.main);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(SingleSignOnPage, {})
    });
};

export { ProtectedSSO, SingleSignOnPage };
//# sourceMappingURL=SingleSignOnPage.mjs.map
