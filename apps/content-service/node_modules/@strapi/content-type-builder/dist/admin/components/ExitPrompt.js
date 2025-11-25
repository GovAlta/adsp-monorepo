'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var useDataManager = require('./DataManager/useDataManager.js');
var getTrad = require('../utils/getTrad.js');

const ExitPrompt = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { isModified, isSaving } = useDataManager.useDataManager();
    const confirmationMessage = formatMessage({
        id: getTrad.getTrad('prompt.unsaved'),
        defaultMessage: 'Are you sure you want to leave? All your modifications will be lost.'
    });
    const blocker = reactRouterDom.useBlocker((ctx)=>{
        return ctx.currentLocation.pathname.startsWith('/plugins/content-type-builder/') && !ctx.nextLocation.pathname.startsWith('/plugins/content-type-builder/') && isModified;
    });
    React.useEffect(()=>{
        const handleBeforeUnload = (event)=>{
            if (isModified && !isSaving) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return ()=>window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [
        confirmationMessage,
        isModified,
        isSaving
    ]);
    if (blocker.state === 'blocked') {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
            open: true,
            onOpenChange: ()=>blocker.reset(),
            children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                onConfirm: ()=>blocker.proceed(),
                children: confirmationMessage
            })
        });
    }
    return null;
};

exports.ExitPrompt = ExitPrompt;
//# sourceMappingURL=ExitPrompt.js.map
