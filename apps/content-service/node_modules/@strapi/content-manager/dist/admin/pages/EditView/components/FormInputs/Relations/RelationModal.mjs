import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext, useQueryParams, Form, useForm, ConfirmDialog, useStrapiApp, useRBAC, DescriptionComponentRenderer } from '@strapi/admin/strapi-admin';
import { Modal, TextButton, Flex, IconButton, Typography, Dialog, Loader, EmptyStateLayout, Box } from '@strapi/design-system';
import { ArrowLeft, ArrowsOut, WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from 'styled-components';
import { COLLECTION_TYPES, SINGLE_TYPES } from '../../../../../constants/collections.mjs';
import { PERMISSIONS } from '../../../../../constants/plugin.mjs';
import { buildValidParams } from '../../../../../utils/api.mjs';
import 'date-fns';
import { DocumentStatus } from '../../DocumentStatus.mjs';
import { useDoc, useDocument } from '../../../../../hooks/useDocument.mjs';
import '../../../../../preview/pages/Preview.mjs';
import { useLazyGetDocumentQuery } from '../../../../../services/documents.mjs';
import { useDocumentLayout } from '../../../../../hooks/useDocumentLayout.mjs';
import { DocumentRBAC } from '../../../../../features/DocumentRBAC.mjs';
import { createYupSchema } from '../../../../../utils/validation.mjs';
import { DocumentActionButton } from '../../DocumentActions.mjs';
import { FormLayout } from '../../FormLayout.mjs';
import { ComponentProvider } from '../ComponentContext.mjs';

function getCollectionType(url) {
    const regex = new RegExp(`(${COLLECTION_TYPES}|${SINGLE_TYPES})`);
    const match = url.match(regex);
    return match ? match[1] : undefined;
}
const StyledModalContent = styled(Modal.Content)`
  width: 90%;
  max-width: 100%;
  height: 90%;
  max-height: 100%;
`;
const getFullPageUrl = (currentDocumentMeta)=>{
    const isSingleType = currentDocumentMeta.collectionType === SINGLE_TYPES;
    const queryParams = currentDocumentMeta.params?.locale ? `?plugins[i18n][locale]=${currentDocumentMeta.params.locale}` : '';
    return `/content-manager/${currentDocumentMeta.collectionType}/${currentDocumentMeta.model}${isSingleType ? '' : '/' + currentDocumentMeta.documentId}${queryParams}`;
};
function reducer(state, action) {
    switch(action.type){
        case 'GO_TO_RELATION':
            if (state.hasUnsavedChanges && !action.payload.shouldBypassConfirmation) {
                return {
                    ...state,
                    confirmDialogIntent: action.payload.document,
                    fieldToConnect: action.payload.fieldToConnect,
                    fieldToConnectUID: action.payload.fieldToConnectUID
                };
            }
            const lastItemDocumentHistory = state.documentHistory.at(-1);
            const hasToResetDocumentHistory = lastItemDocumentHistory && !lastItemDocumentHistory.documentId;
            return {
                ...state,
                // Reset document history if the last item has documentId undefined
                documentHistory: hasToResetDocumentHistory ? [
                    action.payload.document
                ] : [
                    ...state.documentHistory,
                    action.payload.document
                ],
                confirmDialogIntent: null,
                isModalOpen: true,
                fieldToConnect: hasToResetDocumentHistory ? undefined : action.payload.fieldToConnect,
                fieldToConnectUID: hasToResetDocumentHistory ? undefined : action.payload.fieldToConnectUID
            };
        case 'GO_BACK':
            if (state.hasUnsavedChanges && !action.payload.shouldBypassConfirmation) {
                return {
                    ...state,
                    confirmDialogIntent: 'back'
                };
            }
            return {
                ...state,
                documentHistory: state.documentHistory.slice(0, -1),
                confirmDialogIntent: null
            };
        case 'GO_FULL_PAGE':
            if (state.hasUnsavedChanges) {
                return {
                    ...state,
                    confirmDialogIntent: 'navigate'
                };
            }
            return {
                ...state,
                documentHistory: [],
                hasUnsavedChanges: false,
                isModalOpen: false,
                confirmDialogIntent: null
            };
        case 'GO_TO_CREATED_RELATION':
            return {
                ...state,
                // Reset document history if the last item has documentId undefined
                documentHistory: state.documentHistory ? [
                    ...state.documentHistory.slice(0, -1),
                    action.payload.document
                ] : [
                    action.payload.document
                ],
                confirmDialogIntent: null,
                isModalOpen: true,
                fieldToConnect: undefined,
                fieldToConnectUID: undefined
            };
        case 'CANCEL_CONFIRM_DIALOG':
            return {
                ...state,
                confirmDialogIntent: null
            };
        case 'CLOSE_MODAL':
            if (state.hasUnsavedChanges && !action.payload.shouldBypassConfirmation) {
                return {
                    ...state,
                    confirmDialogIntent: 'close'
                };
            }
            return {
                ...state,
                documentHistory: [],
                confirmDialogIntent: null,
                hasUnsavedChanges: false,
                isModalOpen: false
            };
        case 'SET_HAS_UNSAVED_CHANGES':
            return {
                ...state,
                hasUnsavedChanges: action.payload.hasUnsavedChanges
            };
        default:
            return state;
    }
}
const [RelationModalProvider, useRelationModal] = createContext('RelationModal');
function isRenderProp(children) {
    return typeof children === 'function';
}
const RootRelationRenderer = (props)=>{
    const { children } = props;
    const [state, dispatch] = React.useReducer(reducer, {
        documentHistory: [],
        confirmDialogIntent: null,
        isModalOpen: false,
        hasUnsavedChanges: false,
        fieldToConnect: undefined
    });
    const rootDocument = useDoc();
    const [{ query }] = useQueryParams();
    const params = React.useMemo(()=>buildValidParams(query ?? {}), [
        query
    ]);
    const rootDocumentMeta = {
        documentId: rootDocument.document?.documentId || '',
        model: rootDocument.model,
        collectionType: rootDocument.collectionType,
        params
    };
    const currentDocumentMeta = state.documentHistory.at(-1) ?? rootDocumentMeta;
    const currentDocument = useDocument(currentDocumentMeta);
    // TODO: check if we can remove the single type check
    const isSingleType = currentDocumentMeta.collectionType === SINGLE_TYPES;
    const isCreating = !currentDocumentMeta.documentId && !isSingleType;
    /**
   * There is no parent relation, so the relation modal doesn't exist. Create it and set up all the
   * pieces that will be used by potential child relations: the context, header, form, and footer.
   */ return /*#__PURE__*/ jsx(RelationModalProvider, {
        state: state,
        dispatch: dispatch,
        rootDocumentMeta: rootDocumentMeta,
        currentDocumentMeta: currentDocumentMeta,
        currentDocument: currentDocument,
        isCreating: isCreating,
        children: /*#__PURE__*/ jsx(RelationModal, {
            children: isRenderProp(children) ? children({
                dispatch
            }) : props.relation && /*#__PURE__*/ jsx(RelationModalTrigger, {
                relation: props.relation,
                children: children
            })
        })
    });
};
const NestedRelationRenderer = (props)=>{
    const { children } = props;
    const dispatch = useRelationModal('NestedRelation', (state)=>state.dispatch);
    return isRenderProp(children) ? children({
        dispatch
    }) : props.relation && /*#__PURE__*/ jsx(RelationModalTrigger, {
        relation: props.relation,
        children: children
    }); /* This is the trigger that will be rendered in the parent relation */ 
};
/**
 * Component responsible for rendering its children wrapped in a modal, form and context if needed
 */ const RelationModalRenderer = (props)=>{
    // We're in a nested relation if the relation modal context is not undefined
    const isNested = useRelationModal('RelationContextWrapper', (state)=>state != undefined, false);
    return isNested ? /*#__PURE__*/ jsx(NestedRelationRenderer, {
        ...props
    }) : /*#__PURE__*/ jsx(RootRelationRenderer, {
        ...props
    });
};
/* -------------------------------------------------------------------------------------------------
 * RelationModal
 * -----------------------------------------------------------------------------------------------*/ const generateCreateUrl = (currentDocumentMeta)=>{
    return `/content-manager/${currentDocumentMeta.collectionType}/${currentDocumentMeta.model}/create${currentDocumentMeta.params?.locale ? `?plugins[i18n][locale]=${currentDocumentMeta.params.locale}` : ''}`;
};
const RelationModal = ({ children })=>{
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const state = useRelationModal('RelationModalForm', (state)=>state.state);
    const dispatch = useRelationModal('RelationModalForm', (state)=>state.dispatch);
    const currentDocumentMeta = useRelationModal('RelationModalForm', (state)=>state.currentDocumentMeta);
    const currentDocument = useRelationModal('RelationModalForm', (state)=>state.currentDocument);
    const isCreating = useRelationModal('RelationModalForm', (state)=>state.isCreating);
    /*
   * We must wrap the modal window with Component Provider with reset values
   * to avoid inheriting id and uid from the root document and having weird
   * behaviors with simple relationships..
   */ return /*#__PURE__*/ jsx(ComponentProvider, {
        id: undefined,
        level: -1,
        uid: undefined,
        type: undefined,
        children: /*#__PURE__*/ jsxs(Modal.Root, {
            open: state.isModalOpen,
            onOpenChange: (open)=>{
                if (!open) {
                    dispatch({
                        type: 'CLOSE_MODAL',
                        payload: {
                            shouldBypassConfirmation: false
                        }
                    });
                }
            },
            children: [
                children,
                /*#__PURE__*/ jsxs(StyledModalContent, {
                    children: [
                        /*#__PURE__*/ jsx(Modal.Header, {
                            gap: 2,
                            children: /*#__PURE__*/ jsxs(Flex, {
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                                children: [
                                    /*#__PURE__*/ jsxs(Flex, {
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsx(IconButton, {
                                                withTooltip: false,
                                                label: formatMessage({
                                                    id: 'global.back',
                                                    defaultMessage: 'Back'
                                                }),
                                                variant: "ghost",
                                                disabled: state.documentHistory.length < 2,
                                                onClick: ()=>{
                                                    dispatch({
                                                        type: 'GO_BACK',
                                                        payload: {
                                                            shouldBypassConfirmation: false
                                                        }
                                                    });
                                                },
                                                marginRight: 1,
                                                children: /*#__PURE__*/ jsx(ArrowLeft, {})
                                            }),
                                            /*#__PURE__*/ jsx(Typography, {
                                                tag: "span",
                                                fontWeight: 600,
                                                children: isCreating ? formatMessage({
                                                    id: 'content-manager.relation.create',
                                                    defaultMessage: 'Create a relation'
                                                }) : formatMessage({
                                                    id: 'content-manager.components.RelationInputModal.modal-title',
                                                    defaultMessage: 'Edit a relation'
                                                })
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(IconButton, {
                                        onClick: ()=>{
                                            dispatch({
                                                type: 'GO_FULL_PAGE'
                                            });
                                            if (!state.hasUnsavedChanges) {
                                                if (isCreating) {
                                                    navigate(generateCreateUrl(currentDocumentMeta));
                                                } else {
                                                    navigate(getFullPageUrl(currentDocumentMeta));
                                                }
                                            }
                                        },
                                        variant: "tertiary",
                                        label: formatMessage({
                                            id: 'content-manager.components.RelationInputModal.button-fullpage',
                                            defaultMessage: 'Go to entry'
                                        }),
                                        children: /*#__PURE__*/ jsx(ArrowsOut, {})
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsx(Modal.Body, {
                            children: /*#__PURE__*/ jsx(Form, {
                                method: isCreating ? 'POST' : 'PUT',
                                initialValues: currentDocument.getInitialFormValues(isCreating),
                                validate: (values, options)=>{
                                    const yupSchema = createYupSchema(currentDocument.schema?.attributes, currentDocument.components, {
                                        status: currentDocument.document?.status,
                                        ...options
                                    });
                                    return yupSchema.validate(values, {
                                        abortEarly: false
                                    });
                                },
                                children: /*#__PURE__*/ jsx(RelationModalBody, {})
                            })
                        })
                    ]
                })
            ]
        })
    });
};
/**
 * All the main content (not header and footer) of the relation modal, plus the confirmation dialog.
 * Will be wrapped in a Modal.Body by the RelationModal component.
 * Cannot be moved directly inside RelationModal because it needs access to the context via hooks.
 */ const RelationModalBody = ()=>{
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const { formatMessage } = useIntl();
    const [triggerRefetchDocument] = useLazyGetDocumentQuery();
    const state = useRelationModal('RelationModalForm', (state)=>state.state);
    const dispatch = useRelationModal('RelationModalForm', (state)=>state.dispatch);
    const rootDocumentMeta = useRelationModal('RelationModalForm', (state)=>state.rootDocumentMeta);
    const currentDocumentMeta = useRelationModal('RelationModalForm', (state)=>state.currentDocumentMeta);
    const isCreating = useRelationModal('RelationModalForm', (state)=>state.isCreating);
    /**
   * One-way sync the modified state from the form to the modal state.
   * It is needed because we need to consume state from the form context in order to lift it up
   * into the modal context. It is not possible otherwise because the modal needs the form state,
   * but it must be a parent of the form.
   */ const modified = useForm('FormWatcher', (state)=>state.modified);
    const isSubmitting = useForm('FormWatcher', (state)=>state.isSubmitting);
    const hasUnsavedChanges = modified && !isSubmitting;
    React.useEffect(()=>{
        dispatch({
            type: 'SET_HAS_UNSAVED_CHANGES',
            payload: {
                hasUnsavedChanges
            }
        });
    }, [
        hasUnsavedChanges,
        dispatch
    ]);
    const handleCloseModal = (shouldBypassConfirmation)=>{
        dispatch({
            type: 'CLOSE_MODAL',
            payload: {
                shouldBypassConfirmation
            }
        });
        {
            // TODO: check if we can avoid this by relying on RTK invalidatesTags.
            // If so we can delete this function and dispatch the events directly
            triggerRefetchDocument(// TODO check if params should be removed (as they were before)
            rootDocumentMeta, // Favor the cache
            true);
        }
    };
    const handleRedirection = ()=>{
        const editViewUrl = `${pathname}${search}`;
        const fullPageUrl = getFullPageUrl(currentDocumentMeta);
        const isRootDocumentUrl = editViewUrl.includes(fullPageUrl);
        if (isRootDocumentUrl) {
            handleCloseModal(true);
        } else {
            if (isCreating) {
                navigate(generateCreateUrl(currentDocumentMeta));
            } else {
                navigate(fullPageUrl);
            }
        }
    };
    const handleConfirm = ()=>{
        if (state.confirmDialogIntent === null) {
            return;
        }
        if (state.confirmDialogIntent === 'navigate') {
            handleRedirection();
        } else if (state.confirmDialogIntent === 'back') {
            dispatch({
                type: 'GO_BACK',
                payload: {
                    shouldBypassConfirmation: true
                }
            });
        } else if (state.confirmDialogIntent === 'close') {
            handleCloseModal(true);
        } else if ('documentId' in state.confirmDialogIntent) {
            dispatch({
                type: 'GO_TO_RELATION',
                payload: {
                    document: state.confirmDialogIntent,
                    shouldBypassConfirmation: true
                }
            });
        }
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(RelationModalForm, {}),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: state.confirmDialogIntent != null,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                    onConfirm: ()=>handleConfirm(),
                    onCancel: ()=>dispatch({
                            type: 'CANCEL_CONFIRM_DIALOG'
                        }),
                    variant: "danger",
                    children: formatMessage({
                        id: 'content-manager.components.RelationInputModal.confirmation-message',
                        defaultMessage: 'Some changes were not saved. Are you sure you want to close this relation? All changes that were not saved will be lost.'
                    })
                })
            })
        ]
    });
};
const RelationModalTrigger = ({ children, relation })=>{
    const dispatch = useRelationModal('ModalTrigger', (state)=>state.dispatch);
    return /*#__PURE__*/ jsx(StyledTextButton, {
        onClick: ()=>{
            dispatch({
                type: 'GO_TO_RELATION',
                payload: {
                    document: relation,
                    shouldBypassConfirmation: false
                }
            });
        },
        children: children
    });
};
const StyledTextButton = styled(TextButton)`
  max-width: 100%;
  & > span {
    font-size: ${({ theme })=>theme.fontSizes[2]};
    width: inherit;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;
/**
 * The mini edit view for a relation that is displayed inside a modal.
 * It's complete with its header, document actions and form layout.
 */ const RelationModalForm = ()=>{
    const { formatMessage } = useIntl();
    const currentDocumentMeta = useRelationModal('RelationModalForm', (state)=>state.currentDocumentMeta);
    const isCreating = useRelationModal('RelationModalForm', (state)=>state.isCreating);
    const currentDocument = useRelationModal('RelationModalForm', (state)=>state.currentDocument);
    const documentLayoutResponse = useDocumentLayout(currentDocumentMeta.model);
    const plugins = useStrapiApp('RelationModalForm', (state)=>state.plugins);
    const initialValues = isCreating ? currentDocument.getInitialFormValues(isCreating) : currentDocument.getInitialFormValues();
    const { permissions = [], isLoading: isLoadingPermissions, error } = useRBAC(PERMISSIONS.map((action)=>({
            action,
            subject: currentDocumentMeta.model
        })));
    const isLoading = isLoadingPermissions || documentLayoutResponse.isLoading || currentDocument.isLoading;
    if (isLoading && !currentDocument.document?.documentId) {
        return /*#__PURE__*/ jsx(Loader, {
            small: true,
            children: formatMessage({
                id: 'content-manager.ListViewTable.relation-loading',
                defaultMessage: 'Relations are loading'
            })
        });
    }
    if (error || !currentDocumentMeta.model || documentLayoutResponse.error || !isCreating && !currentDocument.document || !isCreating && !currentDocument.meta || !currentDocument.schema || !initialValues) {
        return /*#__PURE__*/ jsx(Flex, {
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                icon: /*#__PURE__*/ jsx(WarningCircle, {
                    width: "16rem"
                }),
                content: formatMessage({
                    id: 'anErrorOccurred',
                    defaultMessage: 'Whoops! Something went wrong. Please, try again.'
                })
            })
        });
    }
    const documentTitle = currentDocument.getTitle(documentLayoutResponse.edit.settings.mainField);
    const hasDraftAndPublished = currentDocument.schema?.options?.draftAndPublish ?? false;
    const props = {
        activeTab: 'draft',
        collectionType: currentDocumentMeta.collectionType,
        model: currentDocumentMeta.model,
        documentId: currentDocumentMeta.documentId,
        document: currentDocument.document,
        meta: currentDocument.meta
    };
    return /*#__PURE__*/ jsxs(DocumentRBAC, {
        permissions: permissions,
        model: currentDocumentMeta.model,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                alignItems: "flex-start",
                direction: "column",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        width: "100%",
                        justifyContent: "space-between",
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsx(Typography, {
                                tag: "h2",
                                variant: "alpha",
                                children: documentTitle
                            }),
                            /*#__PURE__*/ jsx(Flex, {
                                gap: 2,
                                children: /*#__PURE__*/ jsx(DescriptionComponentRenderer, {
                                    props: props,
                                    descriptions: plugins['content-manager'].apis.getDocumentActions('relation-modal'),
                                    children: (actions)=>{
                                        const filteredActions = actions.filter((action)=>{
                                            return [
                                                action.position
                                            ].flat().includes('relation-modal');
                                        });
                                        const [primaryAction, secondaryAction] = filteredActions;
                                        if (!primaryAction && !secondaryAction) return null;
                                        // Both actions are available when draft and publish enabled
                                        if (primaryAction && secondaryAction) {
                                            return /*#__PURE__*/ jsxs(Fragment, {
                                                children: [
                                                    /*#__PURE__*/ jsx(DocumentActionButton, {
                                                        ...secondaryAction,
                                                        variant: secondaryAction.variant || 'secondary'
                                                    }),
                                                    /*#__PURE__*/ jsx(DocumentActionButton, {
                                                        ...primaryAction,
                                                        variant: primaryAction.variant || 'default'
                                                    })
                                                ]
                                            });
                                        }
                                        // Otherwise we just have the save action
                                        return /*#__PURE__*/ jsx(DocumentActionButton, {
                                            ...primaryAction,
                                            variant: primaryAction.variant || 'secondary'
                                        });
                                    }
                                })
                            })
                        ]
                    }),
                    hasDraftAndPublished ? /*#__PURE__*/ jsx(Box, {
                        children: /*#__PURE__*/ jsx(DocumentStatus, {
                            status: currentDocument.document?.status
                        })
                    }) : null
                ]
            }),
            /*#__PURE__*/ jsx(Flex, {
                flex: 1,
                overflow: "auto",
                alignItems: "stretch",
                paddingTop: 7,
                children: /*#__PURE__*/ jsx(Box, {
                    overflow: "auto",
                    flex: 1,
                    children: /*#__PURE__*/ jsx(FormLayout, {
                        layout: documentLayoutResponse.edit.layout,
                        document: currentDocument,
                        hasBackground: false
                    })
                })
            })
        ]
    });
};

export { RelationModalRenderer, getCollectionType, reducer, useRelationModal };
//# sourceMappingURL=RelationModal.mjs.map
