'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var ConfirmDialog = require('../../../../components/ConfirmDialog.js');
var Tours = require('../../../../components/GuidedTour/Tours.js');
var RelativeTime = require('../../../../components/RelativeTime.js');
var Table$1 = require('../../../../components/Table.js');
var Tracking = require('../../../../features/Tracking.js');
var useQueryParams = require('../../../../hooks/useQueryParams.js');

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

const Table = ({ permissions, headers = [], isLoading = false, tokens = [], onConfirmDelete, tokenType })=>{
    const [{ query }] = useQueryParams.useQueryParams();
    const { formatMessage, locale } = reactIntl.useIntl();
    const [, sortOrder] = query && query.sort ? query.sort.split(':') : [
        undefined,
        'ASC'
    ];
    const navigate = reactRouterDom.useNavigate();
    const { trackUsage } = Tracking.useTracking();
    const formatter = designSystem.useCollator(locale);
    const sortedTokens = [
        ...tokens
    ].sort((a, b)=>{
        return sortOrder === 'DESC' ? formatter.compare(b.name, a.name) : formatter.compare(a.name, b.name);
    });
    const { canDelete, canUpdate, canRead } = permissions;
    const handleRowClick = (id)=>()=>{
            if (canRead) {
                trackUsage('willEditTokenFromList', {
                    tokenType
                });
                navigate(id.toString());
            }
        };
    return /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Root, {
        headers: headers,
        rows: sortedTokens,
        isLoading: isLoading,
        children: /*#__PURE__*/ jsxRuntime.jsxs(Table$1.Table.Content, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Head, {
                    children: headers.map((header)=>/*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.HeaderCell, {
                            ...header
                        }, header.name))
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Empty, {}),
                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Loading, {}),
                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Body, {
                    children: sortedTokens.map((token)=>{
                        const GuidedTourTooltip = token.name === 'Read Only' ? Tours.tours.apiTokens.ManageAPIToken : React__namespace.Fragment;
                        return /*#__PURE__*/ jsxRuntime.jsxs(Table$1.Table.Row, {
                            onClick: handleRowClick(token.id),
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Cell, {
                                    maxWidth: "25rem",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral800",
                                        fontWeight: "bold",
                                        ellipsis: true,
                                        children: token.name
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Cell, {
                                    maxWidth: "25rem",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral800",
                                        ellipsis: true,
                                        children: token.description
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Cell, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral800",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(RelativeTime.RelativeTime, {
                                            timestamp: new Date(token.createdAt)
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Cell, {
                                    children: token.lastUsedAt && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral800",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(RelativeTime.RelativeTime, {
                                            timestamp: new Date(token.lastUsedAt),
                                            customIntervals: [
                                                {
                                                    unit: 'hours',
                                                    threshold: 1,
                                                    text: formatMessage({
                                                        id: 'Settings.apiTokens.lastHour',
                                                        defaultMessage: 'last hour'
                                                    })
                                                }
                                            ]
                                        })
                                    })
                                }),
                                canUpdate || canRead || canDelete ? /*#__PURE__*/ jsxRuntime.jsx(Table$1.Table.Cell, {
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        justifyContent: "end",
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(GuidedTourTooltip, {
                                                children: canUpdate && /*#__PURE__*/ jsxRuntime.jsx(UpdateButton, {
                                                    tokenName: token.name,
                                                    tokenId: token.id
                                                })
                                            }),
                                            canDelete && /*#__PURE__*/ jsxRuntime.jsx(DeleteButton, {
                                                tokenName: token.name,
                                                onClickDelete: ()=>onConfirmDelete?.(token.id),
                                                tokenType: tokenType
                                            })
                                        ]
                                    })
                                }) : null
                            ]
                        }, token.id);
                    })
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * CRUD Buttons
 * -----------------------------------------------------------------------------------------------*/ const MESSAGES_MAP = {
    edit: {
        id: 'app.component.table.edit',
        defaultMessage: 'Edit {target}'
    },
    read: {
        id: 'app.component.table.read',
        defaultMessage: 'Read {target}'
    }
};
const DefaultButton = ({ tokenName, tokenId, buttonType = 'edit', children })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(LinkButtonStyled, {
        tag: reactRouterDom.NavLink,
        to: tokenId.toString(),
        onClick: (e)=>e.stopPropagation(),
        title: formatMessage(MESSAGES_MAP[buttonType], {
            target: tokenName
        }),
        variant: "ghost",
        size: "S",
        children: children
    });
};
const LinkButtonStyled = styled.styled(designSystem.LinkButton)`
  padding: 0.7rem;

  & > span {
    display: flex;
  }
`;
const DeleteButton = ({ tokenName, onClickDelete, tokenType })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const handleClickDelete = ()=>{
        trackUsage('willDeleteToken', {
            tokenType
        });
        onClickDelete();
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
            paddingLeft: 1,
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Trigger, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                        label: formatMessage({
                            id: 'global.delete-target',
                            defaultMessage: 'Delete {target}'
                        }, {
                            target: `${tokenName}`
                        }),
                        name: "delete",
                        variant: "ghost",
                        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(ConfirmDialog.ConfirmDialog, {
                    onConfirm: handleClickDelete
                })
            ]
        })
    });
};
const UpdateButton = ({ tokenName, tokenId })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(DefaultButton, {
        tokenName: tokenName,
        tokenId: tokenId,
        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
    });
};

exports.Table = Table;
//# sourceMappingURL=Table.js.map
