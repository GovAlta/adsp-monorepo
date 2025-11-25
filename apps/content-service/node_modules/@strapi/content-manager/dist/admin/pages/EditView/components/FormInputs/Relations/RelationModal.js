'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var collections = require('../../../../../constants/collections.js');
var plugin = require('../../../../../constants/plugin.js');
var api = require('../../../../../utils/api.js');
require('date-fns');
var DocumentStatus = require('../../DocumentStatus.js');
var useDocument = require('../../../../../hooks/useDocument.js');
require('../../../../../preview/pages/Preview.js');
var documents = require('../../../../../services/documents.js');
var useDocumentLayout = require('../../../../../hooks/useDocumentLayout.js');
var DocumentRBAC = require('../../../../../features/DocumentRBAC.js');
var validation = require('../../../../../utils/validation.js');
var DocumentActions = require('../../DocumentActions.js');
var FormLayout = require('../../FormLayout.js');
var ComponentContext = require('../ComponentContext.js');

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

function getCollectionType(url) {
    const regex = new RegExp(`(${collections.COLLECTION_TYPES}|${collections.SINGLE_TYPES})`);
    const match = url.match(regex);
    return match ? match[1] : undefined;
}
const StyledModalContent = styledComponents.styled(designSystem.Modal.Content)`
  width: 90%;
  max-width: 100%;
  height: 90%;
  max-height: 100%;
`;
const getFullPageUrl = (currentDocumentMeta)=>{
    const isSingleType = currentDocumentMeta.collectionType === collections.SINGLE_TYPES;
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
const [RelationModalProvider, useRelationModal] = strapiAdmin.createContext('RelationModal');
function isRenderProp(children) {
    return typeof children === 'function';
}
const RootRelationRenderer = (props)=>{
    const { children } = props;
    const [state, dispatch] = React__namespace.useReducer(reducer, {
        documentHistory: [],
        confirmDialogIntent: null,
        isModalOpen: false,
        hasUnsavedChanges: false,
        fieldToConnect: undefined
    });
    const rootDocument = useDocument.useDoc();
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query ?? {}), [
        query
    ]);
    const rootDocumentMeta = {
        documentId: rootDocument.document?.documentId || '',
        model: rootDocument.model,
        collectionType: rootDocument.collectionType,
        params
    };
    const currentDocumentMeta = state.documentHistory.at(-1) ?? rootDocumentMeta;
    const currentDocument = useDocument.useDocument(currentDocumentMeta);
    // TODO: check if we can remove the single type check
    const isSingleType = currentDocumentMeta.collectionType === collections.SINGLE_TYPES;
    const isCreating = !currentDocumentMeta.documentId && !isSingleType;
    /**
   * There is no parent relation, so the relation modal doesn't exist. Create it and set up all the
   * pieces that will be used by potential child relations: the context, header, form, and footer.
   */ return /*#__PURE__*/ jsxRuntime.jsx(RelationModalProvider, {
        state: state,
        dispatch: dispatch,
        rootDocumentMeta: rootDocumentMeta,
        currentDocumentMeta: currentDocumentMeta,
        currentDocument: currentDocument,
        isCreating: isCreating,
        children: /*#__PURE__*/ jsxRuntime.jsx(RelationModal, {
            children: isRenderProp(children) ? children({
                dispatch
            }) : props.relation && /*#__PURE__*/ jsxRuntime.jsx(RelationModalTrigger, {
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
    }) : props.relation && /*#__PURE__*/ jsxRuntime.jsx(RelationModalTrigger, {
        relation: props.relation,
        children: children
    }); /* This is the trigger that will be rendered in the parent relation */ 
};
/**
 * Component responsible for rendering its children wrapped in a modal, form and context if needed
 */ const RelationModalRenderer = (props)=>{
    // We're in a nested relation if the relation modal context is not undefined
    const isNested = useRelationModal('RelationContextWrapper', (state)=>state != undefined, false);
    return isNested ? /*#__PURE__*/ jsxRuntime.jsx(NestedRelationRenderer, {
        ...props
    }) : /*#__PURE__*/ jsxRuntime.jsx(RootRelationRenderer, {
        ...props
    });
};
/* -------------------------------------------------------------------------------------------------
 * RelationModal
 * -----------------------------------------------------------------------------------------------*/ const generateCreateUrl = (currentDocumentMeta)=>{
    return `/content-manager/${currentDocumentMeta.collectionType}/${currentDocumentMeta.model}/create${currentDocumentMeta.params?.locale ? `?plugins[i18n][locale]=${currentDocumentMeta.params.locale}` : ''}`;
};
const RelationModal = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const state = useRelationModal('RelationModalForm', (state)=>state.state);
    const dispatch = useRelationModal('RelationModalForm', (state)=>state.dispatch);
    const currentDocumentMeta = useRelationModal('RelationModalForm', (state)=>state.currentDocumentMeta);
    const currentDocument = useRelationModal('RelationModalForm', (state)=>state.currentDocument);
    const isCreating = useRelationModal('RelationModalForm', (state)=>state.isCreating);
    /*
   * We must wrap the modal window with Component Provider with reset values
   * to avoid inheriting id and uid from the root document and having weird
   * behaviors with simple relationships..
   */ return /*#__PURE__*/ jsxRuntime.jsx(ComponentContext.ComponentProvider, {
        id: undefined,
        level: -1,
        uid: undefined,
        type: undefined,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Root, {
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
                /*#__PURE__*/ jsxRuntime.jsxs(StyledModalContent, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                            gap: 2,
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
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
                                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.ArrowLeft, {})
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
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
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.ArrowsOut, {})
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Form, {
                                method: isCreating ? 'POST' : 'PUT',
                                initialValues: currentDocument.getInitialFormValues(isCreating),
                                validate: (values, options)=>{
                                    const yupSchema = validation.createYupSchema(currentDocument.schema?.attributes, currentDocument.components, {
                                        status: currentDocument.document?.status,
                                        ...options
                                    });
                                    return yupSchema.validate(values, {
                                        abortEarly: false
                                    });
                                },
                                children: /*#__PURE__*/ jsxRuntime.jsx(RelationModalBody, {})
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
    const navigate = reactRouterDom.useNavigate();
    const { pathname, search } = reactRouterDom.useLocation();
    const { formatMessage } = reactIntl.useIntl();
    const [triggerRefetchDocument] = documents.useLazyGetDocumentQuery();
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
   */ const modified = strapiAdmin.useForm('FormWatcher', (state)=>state.modified);
    const isSubmitting = strapiAdmin.useForm('FormWatcher', (state)=>state.isSubmitting);
    const hasUnsavedChanges = modified && !isSubmitting;
    React__namespace.useEffect(()=>{
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
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(RelationModalForm, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                open: state.confirmDialogIntent != null,
                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
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
    return /*#__PURE__*/ jsxRuntime.jsx(StyledTextButton, {
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
const StyledTextButton = styledComponents.styled(designSystem.TextButton)`
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
    const { formatMessage } = reactIntl.useIntl();
    const currentDocumentMeta = useRelationModal('RelationModalForm', (state)=>state.currentDocumentMeta);
    const isCreating = useRelationModal('RelationModalForm', (state)=>state.isCreating);
    const currentDocument = useRelationModal('RelationModalForm', (state)=>state.currentDocument);
    const documentLayoutResponse = useDocumentLayout.useDocumentLayout(currentDocumentMeta.model);
    const plugins = strapiAdmin.useStrapiApp('RelationModalForm', (state)=>state.plugins);
    const initialValues = isCreating ? currentDocument.getInitialFormValues(isCreating) : currentDocument.getInitialFormValues();
    const { permissions = [], isLoading: isLoadingPermissions, error } = strapiAdmin.useRBAC(plugin.PERMISSIONS.map((action)=>({
            action,
            subject: currentDocumentMeta.model
        })));
    const isLoading = isLoadingPermissions || documentLayoutResponse.isLoading || currentDocument.isLoading;
    if (isLoading && !currentDocument.document?.documentId) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
            small: true,
            children: formatMessage({
                id: 'content-manager.ListViewTable.relation-loading',
                defaultMessage: 'Relations are loading'
            })
        });
    }
    if (error || !currentDocumentMeta.model || documentLayoutResponse.error || !isCreating && !currentDocument.document || !isCreating && !currentDocument.meta || !currentDocument.schema || !initialValues) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                icon: /*#__PURE__*/ jsxRuntime.jsx(Icons.WarningCircle, {
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
    return /*#__PURE__*/ jsxRuntime.jsxs(DocumentRBAC.DocumentRBAC, {
        permissions: permissions,
        model: currentDocumentMeta.model,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                alignItems: "flex-start",
                direction: "column",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        width: "100%",
                        justifyContent: "space-between",
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                tag: "h2",
                                variant: "alpha",
                                children: documentTitle
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                gap: 2,
                                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.DescriptionComponentRenderer, {
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
                                            return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(DocumentActions.DocumentActionButton, {
                                                        ...secondaryAction,
                                                        variant: secondaryAction.variant || 'secondary'
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(DocumentActions.DocumentActionButton, {
                                                        ...primaryAction,
                                                        variant: primaryAction.variant || 'default'
                                                    })
                                                ]
                                            });
                                        }
                                        // Otherwise we just have the save action
                                        return /*#__PURE__*/ jsxRuntime.jsx(DocumentActions.DocumentActionButton, {
                                            ...primaryAction,
                                            variant: primaryAction.variant || 'secondary'
                                        });
                                    }
                                })
                            })
                        ]
                    }),
                    hasDraftAndPublished ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(DocumentStatus.DocumentStatus, {
                            status: currentDocument.document?.status
                        })
                    }) : null
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                flex: 1,
                overflow: "auto",
                alignItems: "stretch",
                paddingTop: 7,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    overflow: "auto",
                    flex: 1,
                    children: /*#__PURE__*/ jsxRuntime.jsx(FormLayout.FormLayout, {
                        layout: documentLayoutResponse.edit.layout,
                        document: currentDocument,
                        hasBackground: false
                    })
                })
            })
        ]
    });
};

exports.RelationModalRenderer = RelationModalRenderer;
exports.getCollectionType = getCollectionType;
exports.reducer = reducer;
exports.useRelationModal = useRelationModal;
//# sourceMappingURL=RelationModal.js.map
