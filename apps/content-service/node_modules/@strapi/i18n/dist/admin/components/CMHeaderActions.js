'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var query = require('@reduxjs/toolkit/query');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var useI18n = require('../hooks/useI18n.js');
var locales = require('../services/locales.js');
var relations = require('../services/relations.js');
var clean = require('../utils/clean.js');
var getTranslation = require('../utils/getTranslation.js');
var strings = require('../utils/strings.js');
var BulkLocaleActionModal = require('./BulkLocaleActionModal.js');

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

const statusVariants = {
    draft: 'secondary',
    published: 'success',
    modified: 'alternative'
};
const LocaleOption = ({ isDraftAndPublishEnabled, locale, status, entryExists })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (!entryExists) {
        return formatMessage({
            id: getTranslation.getTranslation('CMEditViewLocalePicker.locale.create'),
            defaultMessage: 'Create <bold>{locale}</bold> locale'
        }, {
            bold: (locale)=>/*#__PURE__*/ jsxRuntime.jsx("b", {
                    children: locale
                }),
            locale: locale.name
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        width: "100%",
        gap: 1,
        justifyContent: "space-between",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                children: locale.name
            }),
            isDraftAndPublishEnabled ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Status, {
                display: "flex",
                paddingLeft: "6px",
                paddingRight: "6px",
                paddingTop: "2px",
                paddingBottom: "2px",
                size: "S",
                variant: statusVariants[status],
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    tag: "span",
                    variant: "pi",
                    fontWeight: "bold",
                    children: strings.capitalize(status)
                })
            }) : null
        ]
    });
};
const LocalePickerAction = ({ document, meta, model, collectionType, documentId })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }, setQuery] = strapiAdmin.useQueryParams();
    const { hasI18n, canCreate, canRead } = useI18n.useI18n();
    const { data: locales$1 = [] } = locales.useGetLocalesQuery();
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const { schema } = strapiAdmin$1.unstable_useDocument({
        model,
        collectionType,
        documentId,
        params: {
            locale: currentDesiredLocale
        }
    });
    const handleSelect = React__namespace.useCallback((value)=>{
        setQuery({
            plugins: {
                ...query.plugins,
                i18n: {
                    locale: value
                }
            }
        });
    }, [
        query.plugins,
        setQuery
    ]);
    React__namespace.useEffect(()=>{
        if (!Array.isArray(locales$1) || !hasI18n) {
            return;
        }
        /**
     * Handle the case where the current locale query param doesn't exist
     * in the list of available locales, so we redirect to the default locale.
     */ const doesLocaleExist = locales$1.find((loc)=>loc.code === currentDesiredLocale);
        const defaultLocale = locales$1.find((locale)=>locale.isDefault);
        if (!doesLocaleExist && defaultLocale?.code) {
            handleSelect(defaultLocale.code);
        }
    }, [
        handleSelect,
        hasI18n,
        locales$1,
        currentDesiredLocale
    ]);
    const currentLocale = Array.isArray(locales$1) ? locales$1.find((locale)=>locale.code === currentDesiredLocale) : undefined;
    const allCurrentLocales = [
        {
            status: getDocumentStatus(document, meta),
            locale: currentLocale?.code
        },
        ...document?.localizations ?? []
    ];
    if (!hasI18n || !Array.isArray(locales$1) || locales$1.length === 0) {
        return null;
    }
    const displayedLocales = locales$1.filter((locale)=>{
        /**
     * If you can read we allow you to see the locale exists
     * otherwise the locale is hidden.
     */ return canRead.includes(locale.code);
    });
    return {
        label: formatMessage({
            id: getTranslation.getTranslation('Settings.locales.modal.locales.label'),
            defaultMessage: 'Locales'
        }),
        options: displayedLocales.map((locale)=>{
            const entryWithLocaleExists = allCurrentLocales.some((doc)=>doc.locale === locale.code);
            const currentLocaleDoc = allCurrentLocales.find((doc)=>'locale' in doc ? doc.locale === locale.code : false);
            const permissionsToCheck = currentLocaleDoc ? canRead : canCreate;
            return {
                disabled: !permissionsToCheck.includes(locale.code),
                value: locale.code,
                label: /*#__PURE__*/ jsxRuntime.jsx(LocaleOption, {
                    isDraftAndPublishEnabled: !!schema?.options?.draftAndPublish,
                    locale: locale,
                    status: currentLocaleDoc?.status,
                    entryExists: entryWithLocaleExists
                }),
                startIcon: !entryWithLocaleExists ? /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}) : null
            };
        }),
        customizeContent: ()=>currentLocale?.name,
        onSelect: handleSelect,
        value: currentLocale
    };
};
const getDocumentStatus = (document, meta)=>{
    const docStatus = document?.status;
    const statuses = meta?.availableStatus ?? [];
    /**
   * Creating an entry
   */ if (!docStatus) {
        return 'draft';
    }
    /**
   * We're viewing a draft, but the document could have a published version
   */ if (docStatus === 'draft' && statuses.find((doc)=>doc.publishedAt !== null)) {
        return 'published';
    }
    return docStatus;
};
/* -------------------------------------------------------------------------------------------------
 * FillFromAnotherLocaleAction
 * -----------------------------------------------------------------------------------------------*/ const FillFromAnotherLocaleAction = ({ documentId, meta, model, collectionType })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }] = strapiAdmin.useQueryParams();
    const { hasI18n } = useI18n.useI18n();
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const [localeSelected, setLocaleSelected] = React__namespace.useState(null);
    const setValues = strapiAdmin.useForm('FillFromAnotherLocale', (state)=>state.setValues);
    const { getDocument } = strapiAdmin$1.unstable_useDocumentActions();
    const { schema, components } = strapiAdmin$1.unstable_useDocument({
        model,
        documentId,
        collectionType,
        params: {
            locale: currentDesiredLocale
        }
    });
    const { data: locales$1 = [] } = locales.useGetLocalesQuery();
    const availableLocales = Array.isArray(locales$1) ? locales$1.filter((locale)=>meta?.availableLocales.some((l)=>l.locale === locale.code)) : [];
    const fillFromLocale = (onClose)=>async ()=>{
            const response = await getDocument({
                collectionType,
                model,
                documentId,
                params: {
                    locale: localeSelected
                }
            });
            if (!response || !schema) {
                return;
            }
            const { data } = response;
            const cleanedData = clean.cleanData(data, schema, components);
            setValues(cleanedData);
            onClose();
        };
    if (!hasI18n) {
        return null;
    }
    return {
        type: 'icon',
        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Earth, {}),
        disabled: availableLocales.length === 0,
        label: formatMessage({
            id: getTranslation.getTranslation('CMEditViewCopyLocale.copy-text'),
            defaultMessage: 'Fill in from another locale'
        }),
        dialog: {
            type: 'dialog',
            title: formatMessage({
                id: getTranslation.getTranslation('CMEditViewCopyLocale.dialog.title'),
                defaultMessage: 'Confirmation'
            }),
            content: ({ onClose })=>/*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Body, {
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                gap: 3,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                                        width: "24px",
                                        height: "24px",
                                        fill: "danger600"
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textAlign: "center",
                                        children: formatMessage({
                                            id: getTranslation.getTranslation('CMEditViewCopyLocale.dialog.body'),
                                            defaultMessage: 'Your current content will be erased and filled by the content of the selected locale:'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                        width: "100%",
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                children: formatMessage({
                                                    id: getTranslation.getTranslation('CMEditViewCopyLocale.dialog.field.label'),
                                                    defaultMessage: 'Locale'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                                                value: localeSelected,
                                                placeholder: formatMessage({
                                                    id: getTranslation.getTranslation('CMEditViewCopyLocale.dialog.field.placeholder'),
                                                    defaultMessage: 'Select one locale...'
                                                }),
                                                // @ts-expect-error – the DS will handle numbers, but we're not allowing the API.
                                                onChange: (value)=>setLocaleSelected(value),
                                                children: availableLocales.map((locale)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                                        value: locale.code,
                                                        children: locale.name
                                                    }, locale.code))
                                            })
                                        ]
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Footer, {
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                gap: 2,
                                width: "100%",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        flex: "auto",
                                        variant: "tertiary",
                                        onClick: onClose,
                                        children: formatMessage({
                                            id: getTranslation.getTranslation('CMEditViewCopyLocale.cancel-text'),
                                            defaultMessage: 'No, cancel'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        flex: "auto",
                                        variant: "success",
                                        onClick: fillFromLocale(onClose),
                                        children: formatMessage({
                                            id: getTranslation.getTranslation('CMEditViewCopyLocale.submit-text'),
                                            defaultMessage: 'Yes, fill in'
                                        })
                                    })
                                ]
                            })
                        })
                    ]
                })
        }
    };
};
/* -------------------------------------------------------------------------------------------------
 * DeleteLocaleAction
 * -----------------------------------------------------------------------------------------------*/ const DeleteLocaleAction = ({ document, documentId, model, collectionType })=>{
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { delete: deleteAction, isLoading } = strapiAdmin$1.unstable_useDocumentActions();
    const { hasI18n, canDelete } = useI18n.useI18n();
    // Get the current locale object, using the URL instead of document so it works while creating
    const [{ query }] = strapiAdmin.useQueryParams();
    const { data: locales$1 = [] } = locales.useGetLocalesQuery();
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const locale = !('error' in locales$1) && locales$1.find((loc)=>loc.code === currentDesiredLocale);
    if (!hasI18n) {
        return null;
    }
    return {
        disabled: document?.locale && !canDelete.includes(document.locale) || !document || !document.id,
        position: [
            'header',
            'table-row'
        ],
        label: formatMessage({
            id: getTranslation.getTranslation('actions.delete.label'),
            defaultMessage: 'Delete entry ({locale})'
        }, {
            locale: locale && locale.name
        }),
        icon: /*#__PURE__*/ jsxRuntime.jsx(StyledTrash, {}),
        variant: 'danger',
        dialog: {
            type: 'dialog',
            title: formatMessage({
                id: getTranslation.getTranslation('actions.delete.dialog.title'),
                defaultMessage: 'Confirmation'
            }),
            content: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                        width: "24px",
                        height: "24px",
                        fill: "danger600"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "p",
                        variant: "omega",
                        textAlign: "center",
                        children: formatMessage({
                            id: getTranslation.getTranslation('actions.delete.dialog.body'),
                            defaultMessage: 'Are you sure?'
                        })
                    })
                ]
            }),
            loading: isLoading,
            onConfirm: async ()=>{
                const unableToDelete = // We are unable to delete a collection type without a document ID
                // & unable to delete generally if there is no document locale
                collectionType !== 'single-types' && !documentId || !document?.locale;
                if (unableToDelete) {
                    console.error("You're trying to delete a document without an id or locale, this is likely a bug with Strapi. Please open an issue.");
                    toggleNotification({
                        message: formatMessage({
                            id: getTranslation.getTranslation('actions.delete.error'),
                            defaultMessage: 'An error occurred while trying to delete the document locale.'
                        }),
                        type: 'danger'
                    });
                    return;
                }
                const res = await deleteAction({
                    documentId,
                    model,
                    collectionType,
                    params: {
                        locale: document.locale
                    }
                });
                if (!('error' in res)) {
                    navigate({
                        pathname: `../${collectionType}/${model}`
                    }, {
                        replace: true
                    });
                }
            }
        }
    };
};
/* -------------------------------------------------------------------------------------------------
 * BulkLocaleAction
 *
 * This component is used to handle bulk publish and unpublish actions on locales.
 * -----------------------------------------------------------------------------------------------*/ const BulkLocaleAction = ({ document, documentId, model, collectionType, action })=>{
    const locale = document?.locale ?? null;
    const [{ query: query$1 }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>strapiAdmin$1.buildValidParams(query$1), [
        query$1
    ]);
    const isOnPublishedTab = query$1.status === 'published';
    const { formatMessage } = reactIntl.useIntl();
    const { hasI18n, canPublish } = useI18n.useI18n();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const [selectedRows, setSelectedRows] = React__namespace.useState([]);
    const [isDraftRelationConfirmationOpen, setIsDraftRelationConfirmationOpen] = React__namespace.useState(false);
    const { publishMany: publishManyAction, unpublishMany: unpublishManyAction } = strapiAdmin$1.unstable_useDocumentActions();
    const { schema, validate } = strapiAdmin$1.unstable_useDocument({
        model,
        collectionType,
        documentId,
        params: {
            locale
        }
    }, {
        // No need to fetch the document, the data is already available in the `document` prop
        skip: true
    });
    const { data: localesMetadata = [] } = locales.useGetLocalesQuery(hasI18n ? undefined : query.skipToken);
    const headers = [
        {
            label: formatMessage({
                id: 'global.name',
                defaultMessage: 'Name'
            }),
            name: 'name'
        },
        {
            label: formatMessage({
                id: getTranslation.getTranslation('CMEditViewBulkLocale.status'),
                defaultMessage: 'Status'
            }),
            name: 'status'
        },
        {
            label: formatMessage({
                id: getTranslation.getTranslation('CMEditViewBulkLocale.publication-status'),
                defaultMessage: 'Publication Status'
            }),
            name: 'publication-status'
        }
    ];
    // Extract the rows for the bulk locale publish modal and any validation
    // errors per locale
    const [rows, validationErrors] = React__namespace.useMemo(()=>{
        if (!document) {
            return [
                [],
                {}
            ];
        }
        const localizations = document.localizations ?? [];
        // Build the rows for the bulk locale publish modal by combining the current
        // document with all the available locales from the document meta
        const locales = localizations.map((doc)=>{
            const { locale, status } = doc;
            return {
                locale,
                status
            };
        });
        // Add the current document locale
        locales.unshift({
            locale: document.locale,
            status: document.status
        });
        // Build the validation errors for each locale.
        const allDocuments = [
            document,
            ...localizations
        ];
        const errors = allDocuments.reduce((errs, document)=>{
            if (!document) {
                return errs;
            }
            // Validate each locale entry via the useDocument validate function and store any errors in a dictionary
            const validation = validate(document);
            if (validation !== null) {
                errs[document.locale] = validation;
            }
            return errs;
        }, {});
        return [
            locales,
            errors
        ];
    }, [
        document,
        validate
    ]);
    const isBulkPublish = action === 'bulk-publish';
    const localesForAction = selectedRows.reduce((acc, selectedRow)=>{
        const isValidLocale = // Validation errors are irrelevant if we are trying to unpublish
        !isBulkPublish || !Object.keys(validationErrors).includes(selectedRow.locale);
        const shouldAddLocale = isBulkPublish ? selectedRow.status !== 'published' && isValidLocale : selectedRow.status !== 'draft' && isValidLocale;
        if (shouldAddLocale) {
            acc.push(selectedRow.locale);
        }
        return acc;
    }, []);
    // TODO skipping this for now as there is a bug with the draft relation count that will be worked on separately
    // see https://www.notion.so/strapi/Count-draft-relations-56901b492efb45ab90d42fe975b32bd8?pvs=4
    const enableDraftRelationsCount = false;
    const { data: draftRelationsCount = 0, isLoading: isDraftRelationsLoading, error: isDraftRelationsError } = relations.useGetManyDraftRelationCountQuery({
        model,
        documentIds: [
            documentId
        ],
        locale: localesForAction
    }, {
        skip: !enableDraftRelationsCount
    });
    React__namespace.useEffect(()=>{
        if (isDraftRelationsError) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(isDraftRelationsError)
            });
        }
    }, [
        isDraftRelationsError,
        toggleNotification,
        formatAPIError
    ]);
    if (!schema?.options?.draftAndPublish) {
        return null;
    }
    if (!hasI18n) {
        return null;
    }
    if (!documentId) {
        return null;
    }
    // This document action can be enabled given that draft and publish and i18n are
    // enabled and we can publish the current locale.
    const publish = async ()=>{
        await publishManyAction({
            model,
            documentIds: [
                documentId
            ],
            params: {
                ...params,
                locale: localesForAction
            }
        });
        setSelectedRows([]);
    };
    const unpublish = async ()=>{
        await unpublishManyAction({
            model,
            documentIds: [
                documentId
            ],
            params: {
                ...params,
                locale: localesForAction
            }
        });
        setSelectedRows([]);
    };
    const handleAction = async ()=>{
        if (draftRelationsCount > 0) {
            setIsDraftRelationConfirmationOpen(true);
        } else if (isBulkPublish) {
            await publish();
        } else {
            await unpublish();
        }
    };
    if (isDraftRelationConfirmationOpen) {
        return {
            label: formatMessage({
                id: 'app.components.ConfirmDialog.title',
                defaultMessage: 'Confirmation'
            }),
            variant: 'danger',
            dialog: {
                onCancel: ()=>{
                    setIsDraftRelationConfirmationOpen(false);
                },
                onConfirm: async ()=>{
                    await publish();
                    setIsDraftRelationConfirmationOpen(false);
                },
                type: 'dialog',
                title: formatMessage({
                    id: getTranslation.getTranslation('actions.publish.dialog.title'),
                    defaultMessage: 'Confirmation'
                }),
                content: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "column",
                    alignItems: "center",
                    gap: 2,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                            width: "2.4rem",
                            height: "2.4rem",
                            fill: "danger600"
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            textAlign: "center",
                            children: formatMessage({
                                id: getTranslation.getTranslation('CMEditViewBulkLocale.draft-relation-warning'),
                                defaultMessage: 'Some locales are related to draft entries. Publishing them could leave broken links in your app.'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            textAlign: "center",
                            children: formatMessage({
                                id: getTranslation.getTranslation('CMEditViewBulkLocale.continue-confirmation'),
                                defaultMessage: 'Are you sure you want to continue?'
                            })
                        })
                    ]
                })
            }
        };
    }
    const hasPermission = selectedRows.map(({ locale })=>locale).every((locale)=>canPublish.includes(locale));
    return {
        label: formatMessage({
            id: getTranslation.getTranslation(`CMEditViewBulkLocale.${isBulkPublish ? 'publish' : 'unpublish'}-title`),
            defaultMessage: `${isBulkPublish ? 'Publish' : 'Unpublish'} Multiple Locales`
        }),
        variant: isBulkPublish ? 'secondary' : 'danger',
        icon: isBulkPublish ? /*#__PURE__*/ jsxRuntime.jsx(icons.ListPlus, {}) : /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {}),
        disabled: isOnPublishedTab || canPublish.length === 0,
        position: [
            'panel'
        ],
        dialog: {
            type: 'modal',
            title: formatMessage({
                id: getTranslation.getTranslation(`CMEditViewBulkLocale.${isBulkPublish ? 'publish' : 'unpublish'}-title`),
                defaultMessage: `${isBulkPublish ? 'Publish' : 'Unpublish'} Multiple Locales`
            }),
            content: ()=>{
                return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Root, {
                    headers: headers,
                    rows: rows.map((row)=>({
                            ...row,
                            id: row.locale
                        })),
                    selectedRows: selectedRows,
                    onSelectedRowsChange: (tableSelectedRows)=>setSelectedRows(tableSelectedRows),
                    children: /*#__PURE__*/ jsxRuntime.jsx(BulkLocaleActionModal.BulkLocaleActionModal, {
                        validationErrors: validationErrors,
                        headers: headers,
                        rows: rows,
                        localesMetadata: localesMetadata,
                        action: action ?? 'bulk-publish'
                    })
                });
            },
            footer: ()=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Footer, {
                    justifyContent: "flex-end",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        loading: isDraftRelationsLoading,
                        disabled: !hasPermission || localesForAction.length === 0,
                        variant: "default",
                        onClick: handleAction,
                        children: formatMessage({
                            id: isBulkPublish ? 'app.utils.publish' : 'app.utils.unpublish',
                            defaultMessage: isBulkPublish ? 'Publish' : 'Unpublish'
                        })
                    })
                })
        }
    };
};
/* -------------------------------------------------------------------------------------------------
 * BulkLocalePublishAction
 * -----------------------------------------------------------------------------------------------*/ const BulkLocalePublishAction = (props)=>{
    return BulkLocaleAction({
        action: 'bulk-publish',
        ...props
    });
};
/* -------------------------------------------------------------------------------------------------
 * BulkLocaleUnpublishAction
 * -----------------------------------------------------------------------------------------------*/ const BulkLocaleUnpublishAction = (props)=>{
    return BulkLocaleAction({
        action: 'bulk-unpublish',
        ...props
    });
};
/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */ const StyledTrash = styledComponents.styled(icons.Trash)`
  path {
    fill: currentColor;
  }
`;

exports.BulkLocalePublishAction = BulkLocalePublishAction;
exports.BulkLocaleUnpublishAction = BulkLocaleUnpublishAction;
exports.DeleteLocaleAction = DeleteLocaleAction;
exports.FillFromAnotherLocaleAction = FillFromAnotherLocaleAction;
exports.LocalePickerAction = LocalePickerAction;
//# sourceMappingURL=CMHeaderActions.js.map
