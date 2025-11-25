import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotification, useQueryParams, useStrapiApp, DescriptionComponentRenderer } from '@strapi/admin/strapi-admin';
import { Modal, Button, LinkButton } from '@strapi/design-system';
import { Pencil, Duplicate } from '@strapi/icons';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { useNavigate, NavLink } from 'react-router-dom';
import { styled } from 'styled-components';
import { useDocumentRBAC } from '../../../features/DocumentRBAC.mjs';
import { useDoc } from '../../../hooks/useDocument.mjs';
import { useDocumentActions } from '../../../hooks/useDocumentActions.mjs';
import { isBaseQueryError } from '../../../utils/api.mjs';
import { DocumentActionsMenu } from '../../EditView/components/DocumentActions.mjs';
import { AutoCloneFailureModalBody } from './AutoCloneFailureModal.mjs';

const TableActions = ({ document })=>{
    const { formatMessage } = useIntl();
    const { model, collectionType } = useDoc();
    const plugins = useStrapiApp('TableActions', (state)=>state.plugins);
    const props = {
        activeTab: null,
        model,
        documentId: document.documentId,
        collectionType,
        document
    };
    return /*#__PURE__*/ jsx(DescriptionComponentRenderer, {
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
            return /*#__PURE__*/ jsx(DocumentActionsMenu, {
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
    const navigate = useNavigate();
    const { formatMessage } = useIntl();
    const { canRead } = useDocumentRBAC('EditAction', ({ canRead })=>({
            canRead
        }));
    const { toggleNotification } = useNotification();
    const [{ query }] = useQueryParams();
    return {
        disabled: !canRead,
        icon: /*#__PURE__*/ jsx(StyledPencil, {}),
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
                search: stringify({
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
 */ const StyledPencil = styled(Pencil)`
  path {
    fill: currentColor;
  }
`;
const CloneAction = ({ model, documentId })=>{
    const navigate = useNavigate();
    const { formatMessage } = useIntl();
    const { canCreate } = useDocumentRBAC('CloneAction', ({ canCreate })=>({
            canCreate
        }));
    const { toggleNotification } = useNotification();
    const { autoClone } = useDocumentActions();
    const [prohibitedFields, setProhibitedFields] = React.useState([]);
    const [{ query }] = useQueryParams();
    return {
        disabled: !canCreate,
        icon: /*#__PURE__*/ jsx(StyledDuplicate, {}),
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
                    search: stringify({
                        plugins: query.plugins
                    })
                });
                /**
         * We return true because we don't need to show a modal anymore.
         */ return true;
            }
            if (isBaseQueryError(res.error) && res.error.details && typeof res.error.details === 'object' && 'prohibitedFields' in res.error.details && Array.isArray(res.error.details.prohibitedFields)) {
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
            content: /*#__PURE__*/ jsx(AutoCloneFailureModalBody, {
                prohibitedFields: prohibitedFields
            }),
            footer: ({ onClose })=>{
                return /*#__PURE__*/ jsxs(Modal.Footer, {
                    children: [
                        /*#__PURE__*/ jsx(Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            children: formatMessage({
                                id: 'cancel',
                                defaultMessage: 'Cancel'
                            })
                        }),
                        /*#__PURE__*/ jsx(LinkButton, {
                            tag: NavLink,
                            to: {
                                pathname: `clone/${documentId}`,
                                search: stringify({
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
 */ const StyledDuplicate = styled(Duplicate)`
  path {
    fill: currentColor;
  }
`;
const DEFAULT_TABLE_ROW_ACTIONS = [
    EditAction,
    CloneAction
];

export { DEFAULT_TABLE_ROW_ACTIONS, TableActions };
//# sourceMappingURL=TableActions.mjs.map
