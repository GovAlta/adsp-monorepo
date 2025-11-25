'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var useDocument = require('../../../../hooks/useDocument.js');
var documents = require('../../../../services/documents.js');
var translations = require('../../../../utils/translations.js');
var Actions = require('./Actions.js');

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

const ConfirmBulkActionDialog = ({ onToggleDialog, isOpen = false, dialogBody, endAction })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
        open: isOpen,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Content, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Header, {
                    children: formatMessage({
                        id: 'app.components.ConfirmDialog.title',
                        defaultMessage: 'Confirmation'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Body, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
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
                            dialogBody
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Footer, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Cancel, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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
 * -----------------------------------------------------------------------------------------------*/ const BoldChunk = (chunks)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        fontWeight: "bold",
        children: chunks
    });
const ConfirmDialogPublishAll = ({ isOpen, onToggleDialog, isConfirmButtonLoading = false, onConfirm })=>{
    const { formatMessage } = reactIntl.useIntl();
    const selectedEntries = strapiAdmin.useTable('ConfirmDialogPublishAll', (state)=>state.selectedRows);
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler(translations.getTranslation);
    const { model, schema } = useDocument.useDoc();
    const [{ query }] = strapiAdmin.useQueryParams();
    // TODO skipping this for now as there is a bug with the draft relation count that will be worked on separately
    // see RFC "Count draft relations" in Notion
    const enableDraftRelationsCount = false;
    const { data: countDraftRelations = 0, isLoading, error } = documents.useGetManyDraftRelationCountQuery({
        model,
        documentIds: selectedEntries.map((entry)=>entry.documentId),
        locale: query?.plugins?.i18n?.locale
    }, {
        skip: !enableDraftRelationsCount
    });
    React__namespace.useEffect(()=>{
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
    return /*#__PURE__*/ jsxRuntime.jsx(ConfirmBulkActionDialog, {
        isOpen: isOpen && !isLoading,
        onToggleDialog: onToggleDialog,
        dialogBody: /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                    id: "confirm-description",
                    textAlign: "center",
                    children: [
                        countDraftRelations > 0 && formatMessage({
                            id: translations.getTranslation(`popUpwarning.warning.bulk-has-draft-relations.message`),
                            defaultMessage: '<b>{count} {count, plural, one { relation } other { relations } } out of {entities} { entities, plural, one { entry } other { entries } } {count, plural, one { is } other { are } }</b> not published yet and might lead to unexpected behavior. '
                        }, {
                            b: BoldChunk,
                            count: countDraftRelations,
                            entities: selectedEntries.length
                        }),
                        formatMessage({
                            id: translations.getTranslation('popUpWarning.bodyMessage.contentType.publish.all'),
                            defaultMessage: 'Are you sure you want to publish these entries?'
                        })
                    ]
                }),
                schema?.pluginOptions && 'i18n' in schema.pluginOptions && schema?.pluginOptions.i18n && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "danger500",
                    textAlign: "center",
                    children: formatMessage({
                        id: translations.getTranslation('Settings.list.actions.publishAdditionalInfos'),
                        defaultMessage: 'This will publish the active locale versions <em>(from Internationalization)</em>'
                    }, {
                        em: Actions.Emphasis
                    })
                })
            ]
        }),
        endAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            width: '50%',
            onClick: onConfirm,
            variant: "secondary",
            startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Check, {}),
            loading: isConfirmButtonLoading,
            children: formatMessage({
                id: 'app.utils.publish',
                defaultMessage: 'Publish'
            })
        })
    });
};

exports.ConfirmBulkActionDialog = ConfirmBulkActionDialog;
exports.ConfirmDialogPublishAll = ConfirmDialogPublishAll;
//# sourceMappingURL=ConfirmBulkActionDialog.js.map
