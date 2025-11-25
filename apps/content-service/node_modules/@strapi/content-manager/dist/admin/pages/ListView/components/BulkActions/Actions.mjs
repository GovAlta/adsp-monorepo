import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useTable, useQueryParams, useStrapiApp, DescriptionComponentRenderer } from '@strapi/admin/strapi-admin';
import { Flex, Typography, Box } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useDocumentRBAC } from '../../../../features/DocumentRBAC.mjs';
import { useDoc } from '../../../../hooks/useDocument.mjs';
import { useDocumentActions } from '../../../../hooks/useDocumentActions.mjs';
import { buildValidParams } from '../../../../utils/api.mjs';
import { getTranslation } from '../../../../utils/translations.mjs';
import { DocumentActionButton } from '../../../EditView/components/DocumentActions.mjs';
import { PublishAction } from './PublishAction.mjs';

/* -------------------------------------------------------------------------------------------------
 * BulkActionsRenderer
 * -----------------------------------------------------------------------------------------------*/ const BulkActionsRenderer = ()=>{
    const plugins = useStrapiApp('BulkActionsRenderer', (state)=>state.plugins);
    const { model, collectionType } = useDoc();
    const { selectedRows } = useTable('BulkActionsRenderer', (state)=>state);
    return /*#__PURE__*/ jsx(Flex, {
        gap: 2,
        children: /*#__PURE__*/ jsx(DescriptionComponentRenderer, {
            props: {
                model,
                collectionType,
                documents: selectedRows
            },
            descriptions: plugins['content-manager'].apis.getBulkActions(),
            children: (actions)=>actions.map((action)=>/*#__PURE__*/ jsx(DocumentActionButton, {
                        ...action
                    }, action.id))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * DefaultBulkActions
 * -----------------------------------------------------------------------------------------------*/ const DeleteAction = ({ documents, model })=>{
    const { formatMessage } = useIntl();
    const { schema: contentType } = useDoc();
    const selectRow = useTable('DeleteAction', (state)=>state.selectRow);
    const hasI18nEnabled = Boolean(contentType?.pluginOptions?.i18n);
    const [{ query }] = useQueryParams();
    const params = React.useMemo(()=>buildValidParams(query), [
        query
    ]);
    const hasDeletePermission = useDocumentRBAC('deleteAction', (state)=>state.canDelete);
    const { deleteMany: bulkDeleteAction, isLoading } = useDocumentActions();
    const documentIds = documents.map(({ documentId })=>documentId);
    const handleConfirmBulkDelete = async ()=>{
        const res = await bulkDeleteAction({
            documentIds,
            model,
            params
        });
        if (!('error' in res)) {
            selectRow([]);
        }
    };
    if (!hasDeletePermission) return null;
    return {
        variant: 'danger-light',
        label: formatMessage({
            id: 'global.delete',
            defaultMessage: 'Delete'
        }),
        dialog: {
            type: 'dialog',
            title: formatMessage({
                id: 'app.components.ConfirmDialog.title',
                defaultMessage: 'Confirmation'
            }),
            loading: isLoading,
            content: /*#__PURE__*/ jsxs(Flex, {
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
                    /*#__PURE__*/ jsx(Typography, {
                        id: "confirm-description",
                        textAlign: "center",
                        children: formatMessage({
                            id: 'popUpWarning.bodyMessage.contentType.delete.all',
                            defaultMessage: 'Are you sure you want to delete these entries?'
                        })
                    }),
                    hasI18nEnabled && /*#__PURE__*/ jsx(Box, {
                        textAlign: "center",
                        padding: 3,
                        children: /*#__PURE__*/ jsx(Typography, {
                            textColor: "danger500",
                            children: formatMessage({
                                id: getTranslation('Settings.list.actions.deleteAdditionalInfos'),
                                defaultMessage: 'This will delete the active locale versions <em>(from Internationalization)</em>'
                            }, {
                                em: Emphasis
                            })
                        })
                    })
                ]
            }),
            onConfirm: handleConfirmBulkDelete
        }
    };
};
DeleteAction.type = 'delete';
const UnpublishAction = ({ documents, model })=>{
    const { formatMessage } = useIntl();
    const { schema } = useDoc();
    const selectRow = useTable('UnpublishAction', (state)=>state.selectRow);
    const hasPublishPermission = useDocumentRBAC('unpublishAction', (state)=>state.canPublish);
    const hasI18nEnabled = Boolean(schema?.pluginOptions?.i18n);
    const hasDraftAndPublishEnabled = Boolean(schema?.options?.draftAndPublish);
    const { unpublishMany: bulkUnpublishAction, isLoading } = useDocumentActions();
    const documentIds = documents.map(({ documentId })=>documentId);
    const [{ query }] = useQueryParams();
    const params = React.useMemo(()=>buildValidParams(query), [
        query
    ]);
    const handleConfirmBulkUnpublish = async ()=>{
        const data = await bulkUnpublishAction({
            documentIds,
            model,
            params
        });
        if (!('error' in data)) {
            selectRow([]);
        }
    };
    const showUnpublishButton = hasDraftAndPublishEnabled && hasPublishPermission && documents.some((entry)=>entry.status === 'published' || entry.status === 'modified');
    if (!showUnpublishButton) return null;
    return {
        variant: 'tertiary',
        label: formatMessage({
            id: 'app.utils.unpublish',
            defaultMessage: 'Unpublish'
        }),
        dialog: {
            type: 'dialog',
            title: formatMessage({
                id: 'app.components.ConfirmDialog.title',
                defaultMessage: 'Confirmation'
            }),
            loading: isLoading,
            content: /*#__PURE__*/ jsxs(Flex, {
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
                    /*#__PURE__*/ jsx(Typography, {
                        id: "confirm-description",
                        textAlign: "center",
                        children: formatMessage({
                            id: 'popUpWarning.bodyMessage.contentType.unpublish.all',
                            defaultMessage: 'Are you sure you want to unpublish these entries?'
                        })
                    }),
                    hasI18nEnabled && /*#__PURE__*/ jsx(Box, {
                        textAlign: "center",
                        padding: 3,
                        children: /*#__PURE__*/ jsx(Typography, {
                            textColor: "danger500",
                            children: formatMessage({
                                id: getTranslation('Settings.list.actions.unpublishAdditionalInfos'),
                                defaultMessage: 'This will unpublish the active locale versions <em>(from Internationalization)</em>'
                            }, {
                                em: Emphasis
                            })
                        })
                    })
                ]
            }),
            confirmButton: formatMessage({
                id: 'app.utils.unpublish',
                defaultMessage: 'Unpublish'
            }),
            onConfirm: handleConfirmBulkUnpublish
        }
    };
};
UnpublishAction.type = 'unpublish';
const Emphasis = (chunks)=>/*#__PURE__*/ jsx(Typography, {
        fontWeight: "semiBold",
        textColor: "danger500",
        children: chunks
    });
const DEFAULT_BULK_ACTIONS = [
    PublishAction,
    UnpublishAction,
    DeleteAction
];

export { BulkActionsRenderer, DEFAULT_BULK_ACTIONS, Emphasis };
//# sourceMappingURL=Actions.mjs.map
