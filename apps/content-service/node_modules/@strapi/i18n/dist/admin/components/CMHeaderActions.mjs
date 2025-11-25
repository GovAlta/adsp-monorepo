import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useQueryParams, useForm, useNotification, useAPIErrorHandler, Table } from '@strapi/admin/strapi-admin';
import { unstable_useDocument, unstable_useDocumentActions, buildValidParams } from '@strapi/content-manager/strapi-admin';
import { Dialog, Flex, Typography, Field, SingleSelect, SingleSelectOption, Button, Status, Modal } from '@strapi/design-system';
import { Trash, Plus, Earth, WarningCircle, ListPlus, Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';
import { useI18n } from '../hooks/useI18n.mjs';
import { useGetLocalesQuery } from '../services/locales.mjs';
import { useGetManyDraftRelationCountQuery } from '../services/relations.mjs';
import { cleanData } from '../utils/clean.mjs';
import { getTranslation } from '../utils/getTranslation.mjs';
import { capitalize } from '../utils/strings.mjs';
import { BulkLocaleActionModal } from './BulkLocaleActionModal.mjs';

const statusVariants = {
    draft: 'secondary',
    published: 'success',
    modified: 'alternative'
};
const LocaleOption = ({ isDraftAndPublishEnabled, locale, status, entryExists })=>{
    const { formatMessage } = useIntl();
    if (!entryExists) {
        return formatMessage({
            id: getTranslation('CMEditViewLocalePicker.locale.create'),
            defaultMessage: 'Create <bold>{locale}</bold> locale'
        }, {
            bold: (locale)=>/*#__PURE__*/ jsx("b", {
                    children: locale
                }),
            locale: locale.name
        });
    }
    return /*#__PURE__*/ jsxs(Flex, {
        width: "100%",
        gap: 1,
        justifyContent: "space-between",
        children: [
            /*#__PURE__*/ jsx(Typography, {
                children: locale.name
            }),
            isDraftAndPublishEnabled ? /*#__PURE__*/ jsx(Status, {
                display: "flex",
                paddingLeft: "6px",
                paddingRight: "6px",
                paddingTop: "2px",
                paddingBottom: "2px",
                size: "S",
                variant: statusVariants[status],
                children: /*#__PURE__*/ jsx(Typography, {
                    tag: "span",
                    variant: "pi",
                    fontWeight: "bold",
                    children: capitalize(status)
                })
            }) : null
        ]
    });
};
const LocalePickerAction = ({ document, meta, model, collectionType, documentId })=>{
    const { formatMessage } = useIntl();
    const [{ query }, setQuery] = useQueryParams();
    const { hasI18n, canCreate, canRead } = useI18n();
    const { data: locales = [] } = useGetLocalesQuery();
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const { schema } = unstable_useDocument({
        model,
        collectionType,
        documentId,
        params: {
            locale: currentDesiredLocale
        }
    });
    const handleSelect = React.useCallback((value)=>{
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
    React.useEffect(()=>{
        if (!Array.isArray(locales) || !hasI18n) {
            return;
        }
        /**
     * Handle the case where the current locale query param doesn't exist
     * in the list of available locales, so we redirect to the default locale.
     */ const doesLocaleExist = locales.find((loc)=>loc.code === currentDesiredLocale);
        const defaultLocale = locales.find((locale)=>locale.isDefault);
        if (!doesLocaleExist && defaultLocale?.code) {
            handleSelect(defaultLocale.code);
        }
    }, [
        handleSelect,
        hasI18n,
        locales,
        currentDesiredLocale
    ]);
    const currentLocale = Array.isArray(locales) ? locales.find((locale)=>locale.code === currentDesiredLocale) : undefined;
    const allCurrentLocales = [
        {
            status: getDocumentStatus(document, meta),
            locale: currentLocale?.code
        },
        ...document?.localizations ?? []
    ];
    if (!hasI18n || !Array.isArray(locales) || locales.length === 0) {
        return null;
    }
    const displayedLocales = locales.filter((locale)=>{
        /**
     * If you can read we allow you to see the locale exists
     * otherwise the locale is hidden.
     */ return canRead.includes(locale.code);
    });
    return {
        label: formatMessage({
            id: getTranslation('Settings.locales.modal.locales.label'),
            defaultMessage: 'Locales'
        }),
        options: displayedLocales.map((locale)=>{
            const entryWithLocaleExists = allCurrentLocales.some((doc)=>doc.locale === locale.code);
            const currentLocaleDoc = allCurrentLocales.find((doc)=>'locale' in doc ? doc.locale === locale.code : false);
            const permissionsToCheck = currentLocaleDoc ? canRead : canCreate;
            return {
                disabled: !permissionsToCheck.includes(locale.code),
                value: locale.code,
                label: /*#__PURE__*/ jsx(LocaleOption, {
                    isDraftAndPublishEnabled: !!schema?.options?.draftAndPublish,
                    locale: locale,
                    status: currentLocaleDoc?.status,
                    entryExists: entryWithLocaleExists
                }),
                startIcon: !entryWithLocaleExists ? /*#__PURE__*/ jsx(Plus, {}) : null
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
    const { formatMessage } = useIntl();
    const [{ query }] = useQueryParams();
    const { hasI18n } = useI18n();
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const [localeSelected, setLocaleSelected] = React.useState(null);
    const setValues = useForm('FillFromAnotherLocale', (state)=>state.setValues);
    const { getDocument } = unstable_useDocumentActions();
    const { schema, components } = unstable_useDocument({
        model,
        documentId,
        collectionType,
        params: {
            locale: currentDesiredLocale
        }
    });
    const { data: locales = [] } = useGetLocalesQuery();
    const availableLocales = Array.isArray(locales) ? locales.filter((locale)=>meta?.availableLocales.some((l)=>l.locale === locale.code)) : [];
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
            const cleanedData = cleanData(data, schema, components);
            setValues(cleanedData);
            onClose();
        };
    if (!hasI18n) {
        return null;
    }
    return {
        type: 'icon',
        icon: /*#__PURE__*/ jsx(Earth, {}),
        disabled: availableLocales.length === 0,
        label: formatMessage({
            id: getTranslation('CMEditViewCopyLocale.copy-text'),
            defaultMessage: 'Fill in from another locale'
        }),
        dialog: {
            type: 'dialog',
            title: formatMessage({
                id: getTranslation('CMEditViewCopyLocale.dialog.title'),
                defaultMessage: 'Confirmation'
            }),
            content: ({ onClose })=>/*#__PURE__*/ jsxs(Fragment, {
                    children: [
                        /*#__PURE__*/ jsx(Dialog.Body, {
                            children: /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                gap: 3,
                                children: [
                                    /*#__PURE__*/ jsx(WarningCircle, {
                                        width: "24px",
                                        height: "24px",
                                        fill: "danger600"
                                    }),
                                    /*#__PURE__*/ jsx(Typography, {
                                        textAlign: "center",
                                        children: formatMessage({
                                            id: getTranslation('CMEditViewCopyLocale.dialog.body'),
                                            defaultMessage: 'Your current content will be erased and filled by the content of the selected locale:'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxs(Field.Root, {
                                        width: "100%",
                                        children: [
                                            /*#__PURE__*/ jsx(Field.Label, {
                                                children: formatMessage({
                                                    id: getTranslation('CMEditViewCopyLocale.dialog.field.label'),
                                                    defaultMessage: 'Locale'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(SingleSelect, {
                                                value: localeSelected,
                                                placeholder: formatMessage({
                                                    id: getTranslation('CMEditViewCopyLocale.dialog.field.placeholder'),
                                                    defaultMessage: 'Select one locale...'
                                                }),
                                                // @ts-expect-error – the DS will handle numbers, but we're not allowing the API.
                                                onChange: (value)=>setLocaleSelected(value),
                                                children: availableLocales.map((locale)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                                        value: locale.code,
                                                        children: locale.name
                                                    }, locale.code))
                                            })
                                        ]
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsx(Dialog.Footer, {
                            children: /*#__PURE__*/ jsxs(Flex, {
                                gap: 2,
                                width: "100%",
                                children: [
                                    /*#__PURE__*/ jsx(Button, {
                                        flex: "auto",
                                        variant: "tertiary",
                                        onClick: onClose,
                                        children: formatMessage({
                                            id: getTranslation('CMEditViewCopyLocale.cancel-text'),
                                            defaultMessage: 'No, cancel'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Button, {
                                        flex: "auto",
                                        variant: "success",
                                        onClick: fillFromLocale(onClose),
                                        children: formatMessage({
                                            id: getTranslation('CMEditViewCopyLocale.submit-text'),
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
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const { toggleNotification } = useNotification();
    const { delete: deleteAction, isLoading } = unstable_useDocumentActions();
    const { hasI18n, canDelete } = useI18n();
    // Get the current locale object, using the URL instead of document so it works while creating
    const [{ query }] = useQueryParams();
    const { data: locales = [] } = useGetLocalesQuery();
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const locale = !('error' in locales) && locales.find((loc)=>loc.code === currentDesiredLocale);
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
            id: getTranslation('actions.delete.label'),
            defaultMessage: 'Delete entry ({locale})'
        }, {
            locale: locale && locale.name
        }),
        icon: /*#__PURE__*/ jsx(StyledTrash, {}),
        variant: 'danger',
        dialog: {
            type: 'dialog',
            title: formatMessage({
                id: getTranslation('actions.delete.dialog.title'),
                defaultMessage: 'Confirmation'
            }),
            content: /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsx(WarningCircle, {
                        width: "24px",
                        height: "24px",
                        fill: "danger600"
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        tag: "p",
                        variant: "omega",
                        textAlign: "center",
                        children: formatMessage({
                            id: getTranslation('actions.delete.dialog.body'),
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
                            id: getTranslation('actions.delete.error'),
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
    const [{ query }] = useQueryParams();
    const params = React.useMemo(()=>buildValidParams(query), [
        query
    ]);
    const isOnPublishedTab = query.status === 'published';
    const { formatMessage } = useIntl();
    const { hasI18n, canPublish } = useI18n();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [isDraftRelationConfirmationOpen, setIsDraftRelationConfirmationOpen] = React.useState(false);
    const { publishMany: publishManyAction, unpublishMany: unpublishManyAction } = unstable_useDocumentActions();
    const { schema, validate } = unstable_useDocument({
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
    const { data: localesMetadata = [] } = useGetLocalesQuery(hasI18n ? undefined : skipToken);
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
                id: getTranslation('CMEditViewBulkLocale.status'),
                defaultMessage: 'Status'
            }),
            name: 'status'
        },
        {
            label: formatMessage({
                id: getTranslation('CMEditViewBulkLocale.publication-status'),
                defaultMessage: 'Publication Status'
            }),
            name: 'publication-status'
        }
    ];
    // Extract the rows for the bulk locale publish modal and any validation
    // errors per locale
    const [rows, validationErrors] = React.useMemo(()=>{
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
    const { data: draftRelationsCount = 0, isLoading: isDraftRelationsLoading, error: isDraftRelationsError } = useGetManyDraftRelationCountQuery({
        model,
        documentIds: [
            documentId
        ],
        locale: localesForAction
    }, {
        skip: !enableDraftRelationsCount
    });
    React.useEffect(()=>{
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
                    id: getTranslation('actions.publish.dialog.title'),
                    defaultMessage: 'Confirmation'
                }),
                content: /*#__PURE__*/ jsxs(Flex, {
                    direction: "column",
                    alignItems: "center",
                    gap: 2,
                    children: [
                        /*#__PURE__*/ jsx(WarningCircle, {
                            width: "2.4rem",
                            height: "2.4rem",
                            fill: "danger600"
                        }),
                        /*#__PURE__*/ jsx(Typography, {
                            textAlign: "center",
                            children: formatMessage({
                                id: getTranslation('CMEditViewBulkLocale.draft-relation-warning'),
                                defaultMessage: 'Some locales are related to draft entries. Publishing them could leave broken links in your app.'
                            })
                        }),
                        /*#__PURE__*/ jsx(Typography, {
                            textAlign: "center",
                            children: formatMessage({
                                id: getTranslation('CMEditViewBulkLocale.continue-confirmation'),
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
            id: getTranslation(`CMEditViewBulkLocale.${isBulkPublish ? 'publish' : 'unpublish'}-title`),
            defaultMessage: `${isBulkPublish ? 'Publish' : 'Unpublish'} Multiple Locales`
        }),
        variant: isBulkPublish ? 'secondary' : 'danger',
        icon: isBulkPublish ? /*#__PURE__*/ jsx(ListPlus, {}) : /*#__PURE__*/ jsx(Cross, {}),
        disabled: isOnPublishedTab || canPublish.length === 0,
        position: [
            'panel'
        ],
        dialog: {
            type: 'modal',
            title: formatMessage({
                id: getTranslation(`CMEditViewBulkLocale.${isBulkPublish ? 'publish' : 'unpublish'}-title`),
                defaultMessage: `${isBulkPublish ? 'Publish' : 'Unpublish'} Multiple Locales`
            }),
            content: ()=>{
                return /*#__PURE__*/ jsx(Table.Root, {
                    headers: headers,
                    rows: rows.map((row)=>({
                            ...row,
                            id: row.locale
                        })),
                    selectedRows: selectedRows,
                    onSelectedRowsChange: (tableSelectedRows)=>setSelectedRows(tableSelectedRows),
                    children: /*#__PURE__*/ jsx(BulkLocaleActionModal, {
                        validationErrors: validationErrors,
                        headers: headers,
                        rows: rows,
                        localesMetadata: localesMetadata,
                        action: action ?? 'bulk-publish'
                    })
                });
            },
            footer: ()=>/*#__PURE__*/ jsx(Modal.Footer, {
                    justifyContent: "flex-end",
                    children: /*#__PURE__*/ jsx(Button, {
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
 */ const StyledTrash = styled(Trash)`
  path {
    fill: currentColor;
  }
`;

export { BulkLocalePublishAction, BulkLocaleUnpublishAction, DeleteLocaleAction, FillFromAnotherLocaleAction, LocalePickerAction };
//# sourceMappingURL=CMHeaderActions.mjs.map
