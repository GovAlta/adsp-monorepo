import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useTable, useNotification, useAPIErrorHandler, useQueryParams } from '@strapi/admin/strapi-admin';
import { Typography, Button, Dialog, Flex } from '@strapi/design-system';
import { Check, WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useDoc } from '../../../../hooks/useDocument.mjs';
import { useGetManyDraftRelationCountQuery } from '../../../../services/documents.mjs';
import { getTranslation } from '../../../../utils/translations.mjs';
import { Emphasis } from './Actions.mjs';

const ConfirmBulkActionDialog = ({ onToggleDialog, isOpen = false, dialogBody, endAction })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Dialog.Root, {
        open: isOpen,
        children: /*#__PURE__*/ jsxs(Dialog.Content, {
            children: [
                /*#__PURE__*/ jsx(Dialog.Header, {
                    children: formatMessage({
                        id: 'app.components.ConfirmDialog.title',
                        defaultMessage: 'Confirmation'
                    })
                }),
                /*#__PURE__*/ jsx(Dialog.Body, {
                    children: /*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsx(Flex, {
                                justifyContent: "center",
                                children: /*#__PURE__*/ jsx(WarningCircle, {
                                    width: "24px",
                                    height: "24px",
                                    fill: "danger600"
                                })
                            }),
                            dialogBody
                        ]
                    })
                }),
                /*#__PURE__*/ jsxs(Dialog.Footer, {
                    children: [
                        /*#__PURE__*/ jsx(Dialog.Cancel, {
                            children: /*#__PURE__*/ jsx(Button, {
                                width: '50%',
                                onClick: onToggleDialog,
                                variant: "tertiary",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'Cancel'
                                })
                            })
                        }),
                        endAction
                    ]
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * BoldChunk
 * -----------------------------------------------------------------------------------------------*/ const BoldChunk = (chunks)=>/*#__PURE__*/ jsx(Typography, {
        fontWeight: "bold",
        children: chunks
    });
const ConfirmDialogPublishAll = ({ isOpen, onToggleDialog, isConfirmButtonLoading = false, onConfirm })=>{
    const { formatMessage } = useIntl();
    const selectedEntries = useTable('ConfirmDialogPublishAll', (state)=>state.selectedRows);
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler(getTranslation);
    const { model, schema } = useDoc();
    const [{ query }] = useQueryParams();
    // TODO skipping this for now as there is a bug with the draft relation count that will be worked on separately
    // see RFC "Count draft relations" in Notion
    const enableDraftRelationsCount = false;
    const { data: countDraftRelations = 0, isLoading, error } = useGetManyDraftRelationCountQuery({
        model,
        documentIds: selectedEntries.map((entry)=>entry.documentId),
        locale: query?.plugins?.i18n?.locale
    }, {
        skip: !enableDraftRelationsCount
    });
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
    if (error) {
        return null;
    }
    return /*#__PURE__*/ jsx(ConfirmBulkActionDialog, {
        isOpen: isOpen && !isLoading,
        onToggleDialog: onToggleDialog,
        dialogBody: /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsxs(Typography, {
                    id: "confirm-description",
                    textAlign: "center",
                    children: [
                        countDraftRelations > 0 && formatMessage({
                            id: getTranslation(`popUpwarning.warning.bulk-has-draft-relations.message`),
                            defaultMessage: '<b>{count} {count, plural, one { relation } other { relations } } out of {entities} { entities, plural, one { entry } other { entries } } {count, plural, one { is } other { are } }</b> not published yet and might lead to unexpected behavior. '
                        }, {
                            b: BoldChunk,
                            count: countDraftRelations,
                            entities: selectedEntries.length
                        }),
                        formatMessage({
                            id: getTranslation('popUpWarning.bodyMessage.contentType.publish.all'),
                            defaultMessage: 'Are you sure you want to publish these entries?'
                        })
                    ]
                }),
                schema?.pluginOptions && 'i18n' in schema.pluginOptions && schema?.pluginOptions.i18n && /*#__PURE__*/ jsx(Typography, {
                    textColor: "danger500",
                    textAlign: "center",
                    children: formatMessage({
                        id: getTranslation('Settings.list.actions.publishAdditionalInfos'),
                        defaultMessage: 'This will publish the active locale versions <em>(from Internationalization)</em>'
                    }, {
                        em: Emphasis
                    })
                })
            ]
        }),
        endAction: /*#__PURE__*/ jsx(Button, {
            width: '50%',
            onClick: onConfirm,
            variant: "secondary",
            startIcon: /*#__PURE__*/ jsx(Check, {}),
            loading: isConfirmButtonLoading,
            children: formatMessage({
                id: 'app.utils.publish',
                defaultMessage: 'Publish'
            })
        })
    });
};

export { ConfirmBulkActionDialog, ConfirmDialogPublishAll };
//# sourceMappingURL=ConfirmBulkActionDialog.mjs.map
