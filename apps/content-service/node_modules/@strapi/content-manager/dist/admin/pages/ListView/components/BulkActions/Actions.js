'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var DocumentRBAC = require('../../../../features/DocumentRBAC.js');
var useDocument = require('../../../../hooks/useDocument.js');
var useDocumentActions = require('../../../../hooks/useDocumentActions.js');
var api = require('../../../../utils/api.js');
var translations = require('../../../../utils/translations.js');
var DocumentActions = require('../../../EditView/components/DocumentActions.js');
var PublishAction = require('./PublishAction.js');

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

/* -------------------------------------------------------------------------------------------------
 * BulkActionsRenderer
 * -----------------------------------------------------------------------------------------------*/ const BulkActionsRenderer = ()=>{
    const plugins = strapiAdmin.useStrapiApp('BulkActionsRenderer', (state)=>state.plugins);
    const { model, collectionType } = useDocument.useDoc();
    const { selectedRows } = strapiAdmin.useTable('BulkActionsRenderer', (state)=>state);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        gap: 2,
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.DescriptionComponentRenderer, {
            props: {
                model,
                collectionType,
                documents: selectedRows
            },
            descriptions: plugins['content-manager'].apis.getBulkActions(),
            children: (actions)=>actions.map((action)=>/*#__PURE__*/ jsxRuntime.jsx(DocumentActions.DocumentActionButton, {
                        ...action
                    }, action.id))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * DefaultBulkActions
 * -----------------------------------------------------------------------------------------------*/ const DeleteAction = ({ documents, model })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { schema: contentType } = useDocument.useDoc();
    const selectRow = strapiAdmin.useTable('DeleteAction', (state)=>state.selectRow);
    const hasI18nEnabled = Boolean(contentType?.pluginOptions?.i18n);
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query), [
        query
    ]);
    const hasDeletePermission = DocumentRBAC.useDocumentRBAC('deleteAction', (state)=>state.canDelete);
    const { deleteMany: bulkDeleteAction, isLoading } = useDocumentActions.useDocumentActions();
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
            content: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.WarningCircle, {
                            width: "24px",
                            height: "24px",
                            fill: "danger600"
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        id: "confirm-description",
                        textAlign: "center",
                        children: formatMessage({
                            id: 'popUpWarning.bodyMessage.contentType.delete.all',
                            defaultMessage: 'Are you sure you want to delete these entries?'
                        })
                    }),
                    hasI18nEnabled && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        textAlign: "center",
                        padding: 3,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            textColor: "danger500",
                            children: formatMessage({
                                id: translations.getTranslation('Settings.list.actions.deleteAdditionalInfos'),
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
    const { formatMessage } = reactIntl.useIntl();
    const { schema } = useDocument.useDoc();
    const selectRow = strapiAdmin.useTable('UnpublishAction', (state)=>state.selectRow);
    const hasPublishPermission = DocumentRBAC.useDocumentRBAC('unpublishAction', (state)=>state.canPublish);
    const hasI18nEnabled = Boolean(schema?.pluginOptions?.i18n);
    const hasDraftAndPublishEnabled = Boolean(schema?.options?.draftAndPublish);
    const { unpublishMany: bulkUnpublishAction, isLoading } = useDocumentActions.useDocumentActions();
    const documentIds = documents.map(({ documentId })=>documentId);
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query), [
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
            content: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.WarningCircle, {
                            width: "24px",
                            height: "24px",
                            fill: "danger600"
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        id: "confirm-description",
                        textAlign: "center",
                        children: formatMessage({
                            id: 'popUpWarning.bodyMessage.contentType.unpublish.all',
                            defaultMessage: 'Are you sure you want to unpublish these entries?'
                        })
                    }),
                    hasI18nEnabled && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        textAlign: "center",
                        padding: 3,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            textColor: "danger500",
                            children: formatMessage({
                                id: translations.getTranslation('Settings.list.actions.unpublishAdditionalInfos'),
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
const Emphasis = (chunks)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        fontWeight: "semiBold",
        textColor: "danger500",
        children: chunks
    });
const DEFAULT_BULK_ACTIONS = [
    PublishAction.PublishAction,
    UnpublishAction,
    DeleteAction
];

exports.BulkActionsRenderer = BulkActionsRenderer;
exports.DEFAULT_BULK_ACTIONS = DEFAULT_BULK_ACTIONS;
exports.Emphasis = Emphasis;
//# sourceMappingURL=Actions.js.map
