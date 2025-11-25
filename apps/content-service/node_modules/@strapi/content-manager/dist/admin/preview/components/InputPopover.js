'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var InputRenderer = require('../../pages/EditView/components/InputRenderer.js');
var Preview = require('../pages/Preview.js');
var constants = require('../utils/constants.js');
var fieldUtils = require('../utils/fieldUtils.js');

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

const [InputPopoverProvider, useInputPopoverContext] = strapiAdmin.createContext('InputPopover');
function useHasInputPopoverParent() {
    const context = useInputPopoverContext('useHasInputPopoverParent', ()=>true, false);
    // useContext will return undefined if the called is not wrapped in the provider
    return context !== undefined;
}
/* -------------------------------------------------------------------------------------------------
 * InputPopover
 * -----------------------------------------------------------------------------------------------*/ const InputPopover = ({ documentResponse })=>{
    const iframeRef = Preview.usePreviewContext('InputPopover', (state)=>state.iframeRef);
    const popoverField = Preview.usePreviewContext('InputPopover', (state)=>state.popoverField);
    const setPopoverField = Preview.usePreviewContext('InputPopover', (state)=>state.setPopoverField);
    const document = Preview.usePreviewContext('InputPopover', (state)=>state.document);
    const schema = Preview.usePreviewContext('InputPopover', (state)=>state.schema);
    const components = Preview.usePreviewContext('InputPopover', (state)=>state.components);
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    React__namespace.useEffect(()=>{
        /**
     * We receive window events sent from the user's preview via the injected script.
     * We listen to the ones here that target a specific field.
     */ const handleMessage = (event)=>{
            // Only listen to events from the preview iframe
            if (iframeRef.current) {
                const previewOrigin = new URL(iframeRef.current?.src).origin;
                if (event.origin !== previewOrigin) {
                    return;
                }
            }
            if (event.data?.type === constants.INTERNAL_EVENTS.STRAPI_FIELD_FOCUS_INTENT) {
                const fieldMetaData = fieldUtils.parseFieldMetaData(event.data.payload.path);
                if (!fieldMetaData) {
                    const { type, message } = constants.PREVIEW_ERROR_MESSAGES.INCOMPLETE_STRAPI_SOURCE;
                    toggleNotification({
                        type,
                        message: formatMessage(message)
                    });
                    return;
                }
                /**
         * Ignore (for now) content that comes from separate API requests than the one for the
         * current document. This doesn't do anything about fields that may come from relations to
         * the current document however.
         */ if (fieldMetaData.documentId !== document.documentId) {
                    const { type, message } = constants.PREVIEW_ERROR_MESSAGES.DIFFERENT_DOCUMENT;
                    toggleNotification({
                        type,
                        message: formatMessage(message)
                    });
                    return;
                }
                try {
                    const attribute = fieldUtils.getAttributeSchemaFromPath({
                        path: fieldMetaData.path,
                        components,
                        schema,
                        document
                    });
                    // We're able to handle the field, set it in context so the popover can pick it up
                    setPopoverField({
                        ...fieldMetaData,
                        position: event.data.payload.position,
                        attribute
                    });
                } catch (error) {
                    if (error instanceof fieldUtils.PreviewFieldError) {
                        const { type, message } = constants.PREVIEW_ERROR_MESSAGES[error.messageKey];
                        toggleNotification({
                            type,
                            message: formatMessage(message)
                        });
                    } else if (error instanceof Error) {
                        toggleNotification({
                            type: 'danger',
                            message: error.message
                        });
                    }
                }
            }
            if (event.data?.type === constants.INTERNAL_EVENTS.STRAPI_FIELD_SINGLE_CLICK_HINT) {
                toggleNotification({
                    type: 'info',
                    message: formatMessage({
                        id: 'content-manager.preview.info.single-click-hint',
                        defaultMessage: 'Double click to edit'
                    })
                });
            }
        };
        window.addEventListener('message', handleMessage);
        return ()=>{
            window.removeEventListener('message', handleMessage);
        };
    }, [
        components,
        document,
        iframeRef,
        schema,
        setPopoverField,
        toggleNotification,
        formatMessage
    ]);
    if (!popoverField || !iframeRef.current) {
        return null;
    }
    const iframeRect = iframeRef.current.getBoundingClientRect();
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                position: 'fixed',
                top: iframeRect.top + 'px',
                left: iframeRect.left + 'px',
                width: iframeRect.width + 'px',
                height: iframeRect.height + 'px',
                zIndex: 4,
                onClick: ()=>iframeRef.current?.focus()
            }),
            /*#__PURE__*/ jsxRuntime.jsx(InputPopoverProvider, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
                    open: true,
                    onOpenChange: (open)=>!open && setPopoverField(null),
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                position: "fixed",
                                width: popoverField.position.width + 'px',
                                height: popoverField.position.height + 'px',
                                top: 0,
                                left: 0,
                                transform: `translate(${iframeRect.left + popoverField.position.left}px, ${iframeRect.top + popoverField.position.top}px)`
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
                            sideOffset: 4,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                padding: 4,
                                width: "400px",
                                children: /*#__PURE__*/ jsxRuntime.jsx(InputRenderer.InputRenderer, {
                                    document: documentResponse,
                                    attribute: popoverField.attribute,
                                    // TODO: retrieve the proper label from the layout
                                    label: popoverField.path,
                                    name: popoverField.path,
                                    type: popoverField.attribute.type,
                                    visible: true
                                })
                            })
                        })
                    ]
                })
            })
        ]
    });
};

exports.InputPopover = InputPopover;
exports.useHasInputPopoverParent = useHasInputPopoverParent;
//# sourceMappingURL=InputPopover.js.map
