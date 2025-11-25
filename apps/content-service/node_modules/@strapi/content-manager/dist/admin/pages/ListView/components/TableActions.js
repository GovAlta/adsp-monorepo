'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var DocumentRBAC = require('../../../features/DocumentRBAC.js');
var useDocument = require('../../../hooks/useDocument.js');
var useDocumentActions = require('../../../hooks/useDocumentActions.js');
var api = require('../../../utils/api.js');
var DocumentActions = require('../../EditView/components/DocumentActions.js');
var AutoCloneFailureModal = require('./AutoCloneFailureModal.js');

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

const TableActions = ({ document })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { model, collectionType } = useDocument.useDoc();
    const plugins = strapiAdmin.useStrapiApp('TableActions', (state)=>state.plugins);
    const props = {
        activeTab: null,
        model,
        documentId: document.documentId,
        collectionType,
        document
    };
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.DescriptionComponentRenderer, {
        props: props,
        descriptions: plugins['content-manager'].apis.getDocumentActions('table-row')// We explicitly remove the PublishAction from description so we never render it and we don't make unnecessary requests.
        .filter((action)=>action.name !== 'PublishAction'),
        children: (actions)=>{
            const tableRowActions = actions.filter((action)=>{
                const positions = Array.isArray(action.position) ? action.position : [
                    action.position
                ];
                return positions.includes('table-row');
            });
            return /*#__PURE__*/ jsxRuntime.jsx(DocumentActions.DocumentActionsMenu, {
                actions: tableRowActions,
                label: formatMessage({
                    id: 'content-manager.containers.list.table.row-actions',
                    defaultMessage: 'Row actions'
                }),
                variant: "ghost"
            });
        }
    });
};
/* -------------------------------------------------------------------------------------------------
 * TableActionComponents
 * -----------------------------------------------------------------------------------------------*/ const EditAction = ({ documentId })=>{
    const navigate = reactRouterDom.useNavigate();
    const { formatMessage } = reactIntl.useIntl();
    const { canRead } = DocumentRBAC.useDocumentRBAC('EditAction', ({ canRead })=>({
            canRead
        }));
    const { toggleNotification } = strapiAdmin.useNotification();
    const [{ query }] = strapiAdmin.useQueryParams();
    return {
        disabled: !canRead,
        icon: /*#__PURE__*/ jsxRuntime.jsx(StyledPencil, {}),
        label: formatMessage({
            id: 'content-manager.actions.edit.label',
            defaultMessage: 'Edit'
        }),
        position: 'table-row',
        onClick: async ()=>{
            if (!documentId) {
                console.error("You're trying to edit a document without an id, this is likely a bug with Strapi. Please open an issue.");
                toggleNotification({
                    message: formatMessage({
                        id: 'content-manager.actions.edit.error',
                        defaultMessage: 'An error occurred while trying to edit the document.'
                    }),
                    type: 'danger'
                });
                return;
            }
            navigate({
                pathname: documentId,
                search: qs.stringify({
                    plugins: query.plugins
                })
            });
        }
    };
};
EditAction.type = 'edit';
EditAction.position = 'table-row';
/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */ const StyledPencil = styledComponents.styled(Icons.Pencil)`
  path {
    fill: currentColor;
  }
`;
const CloneAction = ({ model, documentId })=>{
    const navigate = reactRouterDom.useNavigate();
    const { formatMessage } = reactIntl.useIntl();
    const { canCreate } = DocumentRBAC.useDocumentRBAC('CloneAction', ({ canCreate })=>({
            canCreate
        }));
    const { toggleNotification } = strapiAdmin.useNotification();
    const { autoClone } = useDocumentActions.useDocumentActions();
    const [prohibitedFields, setProhibitedFields] = React__namespace.useState([]);
    const [{ query }] = strapiAdmin.useQueryParams();
    return {
        disabled: !canCreate,
        icon: /*#__PURE__*/ jsxRuntime.jsx(StyledDuplicate, {}),
        label: formatMessage({
            id: 'content-manager.actions.clone.label',
            defaultMessage: 'Duplicate'
        }),
        position: 'table-row',
        onClick: async ()=>{
            if (!documentId) {
                console.error("You're trying to clone a document in the table without an id, this is likely a bug with Strapi. Please open an issue.");
                toggleNotification({
                    message: formatMessage({
                        id: 'content-manager.actions.clone.error',
                        defaultMessage: 'An error occurred while trying to clone the document.'
                    }),
                    type: 'danger'
                });
                return;
            }
            const res = await autoClone({
                model,
                sourceId: documentId,
                locale: query.plugins?.i18n?.locale
            });
            if ('data' in res) {
                navigate({
                    pathname: res.data.documentId,
                    search: qs.stringify({
                        plugins: query.plugins
                    })
                });
                /**
         * We return true because we don't need to show a modal anymore.
         */ return true;
            }
            if (api.isBaseQueryError(res.error) && res.error.details && typeof res.error.details === 'object' && 'prohibitedFields' in res.error.details && Array.isArray(res.error.details.prohibitedFields)) {
                const prohibitedFields = res.error.details.prohibitedFields;
                setProhibitedFields(prohibitedFields);
            }
        },
        dialog: {
            type: 'modal',
            title: formatMessage({
                id: 'content-manager.containers.list.autoCloneModal.header',
                defaultMessage: 'Duplicate'
            }),
            content: /*#__PURE__*/ jsxRuntime.jsx(AutoCloneFailureModal.AutoCloneFailureModalBody, {
                prohibitedFields: prohibitedFields
            }),
            footer: ({ onClose })=>{
                return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            children: formatMessage({
                                id: 'cancel',
                                defaultMessage: 'Cancel'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                            tag: reactRouterDom.NavLink,
                            to: {
                                pathname: `clone/${documentId}`,
                                search: qs.stringify({
                                    plugins: query.plugins
                                })
                            },
                            children: formatMessage({
                                id: 'content-manager.containers.list.autoCloneModal.create',
                                defaultMessage: 'Create'
                            })
                        })
                    ]
                });
            }
        }
    };
};
CloneAction.type = 'clone';
CloneAction.position = 'table-row';
/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */ const StyledDuplicate = styledComponents.styled(Icons.Duplicate)`
  path {
    fill: currentColor;
  }
`;
const DEFAULT_TABLE_ROW_ACTIONS = [
    EditAction,
    CloneAction
];

exports.DEFAULT_TABLE_ROW_ACTIONS = DEFAULT_TABLE_ROW_ACTIONS;
exports.TableActions = TableActions;
//# sourceMappingURL=TableActions.js.map
