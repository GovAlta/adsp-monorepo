import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotification, useAPIErrorHandler, useRBAC, Page, Layouts } from '@strapi/admin/strapi-admin';
import { EmptyStateLayout } from '@strapi/design-system';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { CreateLocale } from '../components/CreateLocale.mjs';
import { LocaleTable } from '../components/LocaleTable.mjs';
import { PERMISSIONS } from '../constants.mjs';
import { useGetLocalesQuery } from '../services/locales.mjs';
import { getTranslation } from '../utils/getTranslation.mjs';

const SettingsPage = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { data: locales, isLoading: isLoadingLocales, error } = useGetLocalesQuery();
    const { isLoading: isLoadingRBAC, allowedActions: { canUpdate, canCreate, canDelete } } = useRBAC(PERMISSIONS);
    React.useEffect(()=>{
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
    const isLoading = isLoadingLocales || isLoadingRBAC;
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    if (error || !Array.isArray(locales)) {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        tabIndex: -1,
        children: [
            /*#__PURE__*/ jsx(Layouts.Header, {
                primaryAction: /*#__PURE__*/ jsx(CreateLocale, {
                    disabled: !canCreate
                }),
                title: formatMessage({
                    id: getTranslation('plugin.name'),
                    defaultMessage: 'Internationalization'
                }),
                subtitle: formatMessage({
                    id: getTranslation('Settings.list.description'),
                    defaultMessage: 'Configure the settings'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Content, {
                children: locales.length > 0 ? /*#__PURE__*/ jsx(LocaleTable, {
                    locales: locales,
                    canDelete: canDelete,
                    canUpdate: canUpdate
                }) : /*#__PURE__*/ jsx(EmptyStateLayout, {
                    icon: /*#__PURE__*/ jsx(EmptyDocuments, {
                        width: undefined,
                        height: undefined
                    }),
                    content: formatMessage({
                        id: getTranslation('Settings.list.empty.title'),
                        defaultMessage: 'There are no locales'
                    }),
                    action: /*#__PURE__*/ jsx(CreateLocale, {
                        disabled: !canCreate,
                        variant: "secondary"
                    })
                })
            })
        ]
    });
};
const ProtectedSettingsPage = ()=>{
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.read,
        children: /*#__PURE__*/ jsx(SettingsPage, {})
    });
};

export { ProtectedSettingsPage, SettingsPage };
//# sourceMappingURL=SettingsPage.mjs.map
