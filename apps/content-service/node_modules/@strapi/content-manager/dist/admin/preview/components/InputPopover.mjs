import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext, useNotification } from '@strapi/admin/strapi-admin';
import { Box, Popover } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { InputRenderer as MemoizedInputRenderer } from '../../pages/EditView/components/InputRenderer.mjs';
import { usePreviewContext } from '../pages/Preview.mjs';
import { INTERNAL_EVENTS, PREVIEW_ERROR_MESSAGES } from '../utils/constants.mjs';
import { parseFieldMetaData, getAttributeSchemaFromPath, PreviewFieldError } from '../utils/fieldUtils.mjs';

const [InputPopoverProvider, useInputPopoverContext] = createContext('InputPopover');
function useHasInputPopoverParent() {
    const context = useInputPopoverContext('useHasInputPopoverParent', ()=>true, false);
    // useContext will return undefined if the called is not wrapped in the provider
    return context !== undefined;
}
/* -------------------------------------------------------------------------------------------------
 * InputPopover
 * -----------------------------------------------------------------------------------------------*/ const InputPopover = ({ documentResponse })=>{
    const iframeRef = usePreviewContext('InputPopover', (state)=>state.iframeRef);
    const popoverField = usePreviewContext('InputPopover', (state)=>state.popoverField);
    const setPopoverField = usePreviewContext('InputPopover', (state)=>state.setPopoverField);
    const document = usePreviewContext('InputPopover', (state)=>state.document);
    const schema = usePreviewContext('InputPopover', (state)=>state.schema);
    const components = usePreviewContext('InputPopover', (state)=>state.components);
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    React.useEffect(()=>{
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
            if (event.data?.type === INTERNAL_EVENTS.STRAPI_FIELD_FOCUS_INTENT) {
                const fieldMetaData = parseFieldMetaData(event.data.payload.path);
                if (!fieldMetaData) {
                    const { type, message } = PREVIEW_ERROR_MESSAGES.INCOMPLETE_STRAPI_SOURCE;
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
                    const { type, message } = PREVIEW_ERROR_MESSAGES.DIFFERENT_DOCUMENT;
                    toggleNotification({
                        type,
                        message: formatMessage(message)
                    });
                    return;
                }
                try {
                    const attribute = getAttributeSchemaFromPath({
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
                    if (error instanceof PreviewFieldError) {
                        const { type, message } = PREVIEW_ERROR_MESSAGES[error.messageKey];
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
            if (event.data?.type === INTERNAL_EVENTS.STRAPI_FIELD_SINGLE_CLICK_HINT) {
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
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Box, {
                position: 'fixed',
                top: iframeRect.top + 'px',
                left: iframeRect.left + 'px',
                width: iframeRect.width + 'px',
                height: iframeRect.height + 'px',
                zIndex: 4,
                onClick: ()=>iframeRef.current?.focus()
            }),
            /*#__PURE__*/ jsx(InputPopoverProvider, {
                children: /*#__PURE__*/ jsxs(Popover.Root, {
                    open: true,
                    onOpenChange: (open)=>!open && setPopoverField(null),
                    children: [
                        /*#__PURE__*/ jsx(Popover.Trigger, {
                            children: /*#__PURE__*/ jsx(Box, {
                                position: "fixed",
                                width: popoverField.position.width + 'px',
                                height: popoverField.position.height + 'px',
                                top: 0,
                                left: 0,
                                transform: `translate(${iframeRect.left + popoverField.position.left}px, ${iframeRect.top + popoverField.position.top}px)`
                            })
                        }),
                        /*#__PURE__*/ jsx(Popover.Content, {
                            sideOffset: 4,
                            children: /*#__PURE__*/ jsx(Box, {
                                padding: 4,
                                width: "400px",
                                children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
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

export { InputPopover, useHasInputPopoverParent };
//# sourceMappingURL=InputPopover.mjs.map
