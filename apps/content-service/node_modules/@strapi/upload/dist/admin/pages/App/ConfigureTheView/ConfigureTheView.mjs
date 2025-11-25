import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking, useNotification, Layouts, Page, ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Link, Button, Dialog } from '@strapi/design-system';
import { ArrowLeft, Check } from '@strapi/icons';
import isEqual from 'lodash/isEqual';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { useConfig } from '../../../hooks/useConfig.mjs';
import { pluginId } from '../../../pluginId.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { Settings } from './components/Settings.mjs';
import { setLoaded, onChange } from './state/actions.mjs';
import { initialState, init } from './state/init.mjs';
import { reducer } from './state/reducer.mjs';

// TODO: find a better naming convention for the file that was an index file before
const ConfigureTheView = ({ config })=>{
    const { trackUsage } = useTracking();
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { mutateConfig } = useConfig();
    const { isLoading: isSubmittingForm } = mutateConfig;
    const [showWarningSubmit, setWarningSubmit] = React.useState(false);
    const toggleWarningSubmit = ()=>setWarningSubmit((prevState)=>!prevState);
    const [reducerState, dispatch] = React.useReducer(reducer, initialState, ()=>init(config));
    const typedDispatch = dispatch;
    const { initialData, modifiedData } = reducerState;
    const handleSubmit = (e)=>{
        e.preventDefault();
        toggleWarningSubmit();
    };
    const handleConfirm = async ()=>{
        trackUsage('willEditMediaLibraryConfig');
        await mutateConfig.mutateAsync(modifiedData);
        setWarningSubmit(false);
        typedDispatch(setLoaded());
        toggleNotification({
            type: 'success',
            message: formatMessage({
                id: 'notification.form.success.fields',
                defaultMessage: 'Changes saved'
            })
        });
    };
    const handleChange = ({ target: { name, value } })=>{
        typedDispatch(onChange({
            name,
            value
        }));
    };
    return /*#__PURE__*/ jsx(Layouts.Root, {
        children: /*#__PURE__*/ jsx(Page.Main, {
            "aria-busy": isSubmittingForm,
            children: /*#__PURE__*/ jsxs("form", {
                onSubmit: handleSubmit,
                children: [
                    /*#__PURE__*/ jsx(Layouts.Header, {
                        navigationAction: /*#__PURE__*/ jsx(Link, {
                            tag: NavLink,
                            startIcon: /*#__PURE__*/ jsx(ArrowLeft, {}),
                            to: `/plugins/${pluginId}`,
                            id: "go-back",
                            children: formatMessage({
                                id: getTrad('config.back'),
                                defaultMessage: 'Back'
                            })
                        }),
                        primaryAction: /*#__PURE__*/ jsx(Button, {
                            size: "S",
                            startIcon: /*#__PURE__*/ jsx(Check, {}),
                            disabled: isEqual(modifiedData, initialData),
                            type: "submit",
                            children: formatMessage({
                                id: 'global.save',
                                defaultMessage: 'Save'
                            })
                        }),
                        subtitle: formatMessage({
                            id: getTrad('config.subtitle'),
                            defaultMessage: 'Define the view settings of the media library.'
                        }),
                        title: formatMessage({
                            id: getTrad('config.title'),
                            defaultMessage: 'Configure the view - Media Library'
                        })
                    }),
                    /*#__PURE__*/ jsx(Layouts.Content, {
                        children: /*#__PURE__*/ jsx(Settings, {
                            "data-testid": "settings",
                            pageSize: modifiedData.pageSize || '',
                            sort: modifiedData.sort || '',
                            onChange: handleChange
                        })
                    }),
                    "x",
                    /*#__PURE__*/ jsx(Dialog.Root, {
                        open: showWarningSubmit,
                        onOpenChange: toggleWarningSubmit,
                        children: /*#__PURE__*/ jsx(ConfirmDialog, {
                            onConfirm: handleConfirm,
                            variant: "default",
                            children: formatMessage({
                                id: getTrad('config.popUpWarning.warning.updateAllSettings'),
                                defaultMessage: 'This will modify all your settings'
                            })
                        })
                    })
                ]
            })
        })
    });
};

export { ConfigureTheView };
//# sourceMappingURL=ConfigureTheView.mjs.map
