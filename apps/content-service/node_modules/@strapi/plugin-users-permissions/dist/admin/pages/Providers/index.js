'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var admin = require('@strapi/strapi/admin');
var upperFirst = require('lodash/upperFirst');
var reactIntl = require('react-intl');
var reactQuery = require('react-query');
var index = require('../../components/FormModal/index.js');
var constants = require('../../constants.js');
require('lodash/isEmpty');
var getTrad = require('../../utils/getTrad.js');
var forms = require('./utils/forms.js');

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

const ProvidersPage = ()=>{
    const { formatMessage, locale } = reactIntl.useIntl();
    const queryClient = reactQuery.useQueryClient();
    const { trackUsage } = strapiAdmin.useTracking();
    const [isOpen, setIsOpen] = React__namespace.useState(false);
    const [providerToEditName, setProviderToEditName] = React__namespace.useState(null);
    const { toggleNotification } = admin.useNotification();
    const { get, put } = admin.useFetchClient();
    const { formatAPIError } = admin.useAPIErrorHandler();
    const formatter = designSystem.useCollator(locale, {
        sensitivity: 'base'
    });
    const { isLoading: isLoadingPermissions, allowedActions: { canUpdate } } = admin.useRBAC({
        update: constants.PERMISSIONS.updateProviders
    });
    const { isLoading: isLoadingData, data } = reactQuery.useQuery([
        'users-permissions',
        'get-providers'
    ], async ()=>{
        const { data } = await get('/users-permissions/providers');
        return data;
    }, {
        initialData: {}
    });
    const submitMutation = reactQuery.useMutation((body)=>put('/users-permissions/providers', body), {
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
    const isProviderWithSubdomain = React__namespace.useMemo(()=>{
        if (!providerToEditName) {
            return false;
        }
        const providerToEdit = providers.find((obj)=>obj.name === providerToEditName);
        return !!providerToEdit?.subdomain;
    }, [
        providers,
        providerToEditName
    ]);
    const layoutToRender = React__namespace.useMemo(()=>{
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
        return /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Layouts.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(admin.Page.Title, {
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
            /*#__PURE__*/ jsxRuntime.jsxs(admin.Page.Main, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
                        title: formatMessage({
                            id: getTrad('HeaderNav.link.providers'),
                            defaultMessage: 'Providers'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
                            colCount: 3,
                            rowCount: providers.length + 1,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    variant: "sigma",
                                                    textColor: "neutral600",
                                                    children: formatMessage({
                                                        id: 'global.name',
                                                        defaultMessage: 'Name'
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    variant: "sigma",
                                                    textColor: "neutral600",
                                                    children: formatMessage({
                                                        id: getTrad('Providers.status'),
                                                        defaultMessage: 'Status'
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    variant: "sigma",
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
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
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
                                    children: providers.map((provider)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                            onClick: ()=>canUpdate ? handleClickEdit(provider) : undefined,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                    width: "45%",
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        fontWeight: "semiBold",
                                                        textColor: "neutral800",
                                                        children: provider.name
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                    width: "65%",
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                    onClick: (e)=>e.stopPropagation(),
                                                    children: canUpdate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                        onClick: ()=>handleClickEdit(provider),
                                                        variant: "ghost",
                                                        label: "Edit",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
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
            /*#__PURE__*/ jsxRuntime.jsx(index, {
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
const ProtectedProvidersPage = ()=>/*#__PURE__*/ jsxRuntime.jsx(admin.Page.Protect, {
        permissions: constants.PERMISSIONS.readProviders,
        children: /*#__PURE__*/ jsxRuntime.jsx(ProvidersPage, {})
    });

exports.ProvidersPage = ProvidersPage;
exports.default = ProtectedProvidersPage;
//# sourceMappingURL=index.js.map
