import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, Layouts } from '@strapi/admin/strapi-admin';
import { useCollator, Table, Thead, Tr, Th, Typography, VisuallyHidden, Tbody, Td, IconButton } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { useNotification, useFetchClient, useAPIErrorHandler, useRBAC, Page } from '@strapi/strapi/admin';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import FormModal from '../../components/FormModal/index.mjs';
import { PERMISSIONS } from '../../constants.mjs';
import 'lodash/isEmpty';
import getTrad from '../../utils/getTrad.mjs';
import forms from './utils/forms.mjs';

const ProvidersPage = ()=>{
    const { formatMessage, locale } = useIntl();
    const queryClient = useQueryClient();
    const { trackUsage } = useTracking();
    const [isOpen, setIsOpen] = React.useState(false);
    const [providerToEditName, setProviderToEditName] = React.useState(null);
    const { toggleNotification } = useNotification();
    const { get, put } = useFetchClient();
    const { formatAPIError } = useAPIErrorHandler();
    const formatter = useCollator(locale, {
        sensitivity: 'base'
    });
    const { isLoading: isLoadingPermissions, allowedActions: { canUpdate } } = useRBAC({
        update: PERMISSIONS.updateProviders
    });
    const { isLoading: isLoadingData, data } = useQuery([
        'users-permissions',
        'get-providers'
    ], async ()=>{
        const { data } = await get('/users-permissions/providers');
        return data;
    }, {
        initialData: {}
    });
    const submitMutation = useMutation((body)=>put('/users-permissions/providers', body), {
        async onSuccess () {
            await queryClient.invalidateQueries([
                'users-permissions',
                'get-providers'
            ]);
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad('notification.success.submit')
                })
            });
            trackUsage('didEditAuthenticationProvider');
            handleToggleModal();
        },
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        },
        refetchActive: false
    });
    const providers = Object.entries(data).reduce((acc, [name, provider])=>{
        const { icon, enabled, subdomain } = provider;
        acc.push({
            name,
            icon: icon === 'envelope' ? [
                'fas',
                'envelope'
            ] : [
                'fab',
                icon
            ],
            enabled,
            subdomain
        });
        return acc;
    }, []).sort((a, b)=>formatter.compare(a.name, b.name));
    const isLoading = isLoadingData || isLoadingPermissions;
    const isProviderWithSubdomain = React.useMemo(()=>{
        if (!providerToEditName) {
            return false;
        }
        const providerToEdit = providers.find((obj)=>obj.name === providerToEditName);
        return !!providerToEdit?.subdomain;
    }, [
        providers,
        providerToEditName
    ]);
    const layoutToRender = React.useMemo(()=>{
        if (providerToEditName === 'email') {
            return forms.email;
        }
        if (isProviderWithSubdomain) {
            return forms.providersWithSubdomain;
        }
        return forms.providers;
    }, [
        providerToEditName,
        isProviderWithSubdomain
    ]);
    const handleToggleModal = ()=>{
        setIsOpen((prev)=>!prev);
    };
    const handleClickEdit = (provider)=>{
        if (canUpdate) {
            setProviderToEditName(provider.name);
            handleToggleModal();
        }
    };
    const handleSubmit = async (values)=>{
        trackUsage('willEditAuthenticationProvider');
        submitMutation.mutate({
            providers: {
                ...data,
                [providerToEditName]: values
            }
        });
    };
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Layouts.Root, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: formatMessage({
                        id: getTrad('HeaderNav.link.providers'),
                        defaultMessage: 'Providers'
                    })
                })
            }),
            /*#__PURE__*/ jsxs(Page.Main, {
                children: [
                    /*#__PURE__*/ jsx(Layouts.Header, {
                        title: formatMessage({
                            id: getTrad('HeaderNav.link.providers'),
                            defaultMessage: 'Providers'
                        })
                    }),
                    /*#__PURE__*/ jsx(Layouts.Content, {
                        children: /*#__PURE__*/ jsxs(Table, {
                            colCount: 3,
                            rowCount: providers.length + 1,
                            children: [
                                /*#__PURE__*/ jsx(Thead, {
                                    children: /*#__PURE__*/ jsxs(Tr, {
                                        children: [
                                            /*#__PURE__*/ jsx(Th, {
                                                children: /*#__PURE__*/ jsx(Typography, {
                                                    variant: "sigma",
                                                    textColor: "neutral600",
                                                    children: formatMessage({
                                                        id: 'global.name',
                                                        defaultMessage: 'Name'
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Th, {
                                                children: /*#__PURE__*/ jsx(Typography, {
                                                    variant: "sigma",
                                                    textColor: "neutral600",
                                                    children: formatMessage({
                                                        id: getTrad('Providers.status'),
                                                        defaultMessage: 'Status'
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Th, {
                                                children: /*#__PURE__*/ jsx(Typography, {
                                                    variant: "sigma",
                                                    children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                                        children: formatMessage({
                                                            id: 'global.settings',
                                                            defaultMessage: 'Settings'
                                                        })
                                                    })
                                                })
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ jsx(Tbody, {
                                    children: providers.map((provider)=>/*#__PURE__*/ jsxs(Tr, {
                                            onClick: ()=>canUpdate ? handleClickEdit(provider) : undefined,
                                            children: [
                                                /*#__PURE__*/ jsx(Td, {
                                                    width: "45%",
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        fontWeight: "semiBold",
                                                        textColor: "neutral800",
                                                        children: provider.name
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Td, {
                                                    width: "65%",
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        textColor: provider.enabled ? 'success600' : 'danger600',
                                                        "data-testid": `enable-${provider.name}`,
                                                        children: provider.enabled ? formatMessage({
                                                            id: 'global.enabled',
                                                            defaultMessage: 'Enabled'
                                                        }) : formatMessage({
                                                            id: 'global.disabled',
                                                            defaultMessage: 'Disabled'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Td, {
                                                    onClick: (e)=>e.stopPropagation(),
                                                    children: canUpdate && /*#__PURE__*/ jsx(IconButton, {
                                                        onClick: ()=>handleClickEdit(provider),
                                                        variant: "ghost",
                                                        label: "Edit",
                                                        children: /*#__PURE__*/ jsx(Pencil, {})
                                                    })
                                                })
                                            ]
                                        }, provider.name))
                                })
                            ]
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(FormModal, {
                initialData: data[providerToEditName],
                isOpen: isOpen,
                isSubmiting: submitMutation.isLoading,
                layout: layoutToRender,
                headerBreadcrumbs: [
                    formatMessage({
                        id: getTrad('PopUpForm.header.edit.providers'),
                        defaultMessage: 'Edit Provider'
                    }),
                    upperFirst(providerToEditName)
                ],
                onToggle: handleToggleModal,
                onSubmit: handleSubmit,
                providerToEditName: providerToEditName
            })
        ]
    });
};
const ProtectedProvidersPage = ()=>/*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.readProviders,
        children: /*#__PURE__*/ jsx(ProvidersPage, {})
    });

export { ProvidersPage, ProtectedProvidersPage as default };
//# sourceMappingURL=index.mjs.map
