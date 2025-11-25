import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext } from '@radix-ui/react-context';
import { useIntl } from 'react-intl';
import { Page } from '../components/PageHelpers.mjs';
import { useTypedSelector } from '../core/store/hooks.mjs';
import { useAPIErrorHandler } from '../hooks/useAPIErrorHandler.mjs';
import { useRBAC } from '../hooks/useRBAC.mjs';
import { useInitQuery, useProjectSettingsQuery, useUpdateProjectSettingsMutation } from '../services/admin.mjs';
import { useAuth } from './Auth.mjs';
import { useNotification } from './Notifications.mjs';
import { useTracking } from './Tracking.mjs';

const [ConfigurationContextProvider, useConfiguration] = createContext('ConfigurationContext');
const ConfigurationProvider = ({ children, defaultAuthLogo, defaultMenuLogo, showReleaseNotification = false })=>{
    const { trackUsage } = useTracking();
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['project-settings']);
    const token = useAuth('ConfigurationProvider', (state)=>state.token);
    const { allowedActions: { canRead } } = useRBAC(permissions);
    const { data: { authLogo: customAuthLogo, menuLogo: customMenuLogo } = {}, error, isLoading } = useInitQuery();
    React.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'app.containers.App.notification.error.init'
                })
            });
        }
    }, [
        error,
        formatMessage,
        toggleNotification
    ]);
    const { data, isSuccess } = useProjectSettingsQuery(undefined, {
        skip: !token || !canRead
    });
    const [updateProjectSettingsMutation] = useUpdateProjectSettingsMutation();
    const updateProjectSettings = React.useCallback(async (body)=>{
        const formData = new FormData();
        /**
       * We either only send files or we send null values.
       * Null removes the logo. If you don't want to effect
       * an existing logo, don't send anything.
       */ Object.entries(body).forEach(([key, value])=>{
            if (value?.rawFile) {
                formData.append(key, value.rawFile);
            } else if (value === null) {
                formData.append(key, JSON.stringify(value));
            }
        });
        const res = await updateProjectSettingsMutation(formData);
        if ('data' in res) {
            const updatedMenuLogo = !!res.data.menuLogo && !!body.menuLogo?.rawFile;
            const updatedAuthLogo = !!res.data.authLogo && !!body.authLogo?.rawFile;
            if (updatedMenuLogo) {
                trackUsage('didChangeLogo', {
                    logo: 'menu'
                });
            }
            if (updatedAuthLogo) {
                trackUsage('didChangeLogo', {
                    logo: 'auth'
                });
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'app',
                    defaultMessage: 'Saved'
                })
            });
        } else {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(res.error)
            });
        }
    }, [
        formatAPIError,
        formatMessage,
        toggleNotification,
        trackUsage,
        updateProjectSettingsMutation
    ]);
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsx(ConfigurationContextProvider, {
        showReleaseNotification: showReleaseNotification,
        logos: {
            menu: {
                custom: isSuccess ? data?.menuLogo : {
                    url: customMenuLogo ?? ''
                },
                default: defaultMenuLogo
            },
            auth: {
                custom: isSuccess ? data?.authLogo : {
                    url: customAuthLogo ?? ''
                },
                default: defaultAuthLogo
            }
        },
        updateProjectSettings: updateProjectSettings,
        children: children
    });
};

export { ConfigurationProvider, ConfigurationContextProvider as _internalConfigurationContextProvider, useConfiguration };
//# sourceMappingURL=Configuration.mjs.map
