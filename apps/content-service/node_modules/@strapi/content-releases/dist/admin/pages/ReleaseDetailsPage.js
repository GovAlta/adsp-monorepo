'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var format = require('date-fns/format');
var dateFnsTz = require('date-fns-tz');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var EntryValidationPopover = require('../components/EntryValidationPopover.js');
var RelativeTime = require('../components/RelativeTime.js');
var ReleaseActionMenu = require('../components/ReleaseActionMenu.js');
var ReleaseActionOptions = require('../components/ReleaseActionOptions.js');
var ReleaseModal = require('../components/ReleaseModal.js');
var constants = require('../constants.js');
var release = require('../services/release.js');
var hooks = require('../store/hooks.js');
var api = require('../utils/api.js');
var time = require('../utils/time.js');
var ReleasesPage = require('./ReleasesPage.js');

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
 * ReleaseDetailsLayout
 * -----------------------------------------------------------------------------------------------*/ const ReleaseInfoWrapper = styledComponents.styled(designSystem.Flex)`
  align-self: stretch;
  border-bottom-right-radius: ${({ theme })=>theme.borderRadius};
  border-bottom-left-radius: ${({ theme })=>theme.borderRadius};
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const ReleaseDetailsLayout = ({ toggleEditReleaseModal, toggleWarningSubmit, children })=>{
    const { formatMessage, formatDate, formatTime } = reactIntl.useIntl();
    const { releaseId } = reactRouterDom.useParams();
    const { data, isLoading: isLoadingDetails, error } = release.useGetReleaseQuery({
        id: releaseId
    }, {
        skip: !releaseId
    });
    const [publishRelease, { isLoading: isPublishing }] = release.usePublishReleaseMutation();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { allowedActions } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    const { canUpdate, canDelete, canPublish } = allowedActions;
    const dispatch = hooks.useTypedDispatch();
    const { trackUsage } = strapiAdmin.useTracking();
    const release$1 = data?.data;
    const handlePublishRelease = (id)=>async ()=>{
            const response = await publishRelease({
                id
            });
            if ('data' in response) {
                // When the response returns an object with 'data', handle success
                toggleNotification({
                    type: 'success',
                    message: formatMessage({
                        id: 'content-releases.pages.ReleaseDetails.publish-notification-success',
                        defaultMessage: 'Release was published successfully.'
                    })
                });
                const { totalEntries, totalPublishedEntries, totalUnpublishedEntries } = response.data.meta;
                trackUsage('didPublishRelease', {
                    totalEntries,
                    totalPublishedEntries,
                    totalUnpublishedEntries
                });
            } else if (strapiAdmin.isFetchError(response.error)) {
                // When the response returns an object with 'error', handle fetch error
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(response.error)
                });
            } else {
                // Otherwise, the response returns an object with 'error', handle a generic error
                toggleNotification({
                    type: 'danger',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'An error occurred'
                    })
                });
            }
        };
    const handleRefresh = ()=>{
        dispatch(release.releaseApi.util.invalidateTags([
            {
                type: 'ReleaseAction',
                id: 'LIST'
            },
            {
                type: 'Release',
                id: releaseId
            }
        ]));
    };
    const getCreatedByUser = ()=>{
        if (!release$1?.createdBy) {
            return null;
        }
        // Favor the username
        if (release$1.createdBy.username) {
            return release$1.createdBy.username;
        }
        // Firstname may not exist if created with SSO
        if (release$1.createdBy.firstname) {
            return `${release$1.createdBy.firstname} ${release$1.createdBy.lastname || ''}`.trim();
        }
        // All users must have at least an email
        return release$1.createdBy.email;
    };
    if (isLoadingDetails) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    if (api.isBaseQueryError(error) && 'code' in error || !release$1) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "..",
            state: {
                errors: [
                    {
                        // @ts-expect-error – TODO: fix this weird error flow
                        code: error?.code
                    }
                ]
            }
        });
    }
    const totalEntries = release$1.actions.meta.count || 0;
    const hasCreatedByUser = Boolean(getCreatedByUser());
    const isScheduled = release$1.scheduledAt && release$1.timezone;
    const numberOfEntriesText = formatMessage({
        id: 'content-releases.pages.Details.header-subtitle',
        defaultMessage: '{number, plural, =0 {No entries} one {# entry} other {# entries}}'
    }, {
        number: totalEntries
    });
    const scheduledText = isScheduled ? formatMessage({
        id: 'content-releases.pages.ReleaseDetails.header-subtitle.scheduled',
        defaultMessage: 'Scheduled for {date} at {time} ({offset})'
    }, {
        date: formatDate(new Date(release$1.scheduledAt), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: release$1.timezone
        }),
        time: formatTime(new Date(release$1.scheduledAt), {
            timeZone: release$1.timezone,
            hourCycle: 'h23'
        }),
        offset: time.getTimezoneOffset(release$1.timezone, new Date(release$1.scheduledAt))
    }) : '';
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Root, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            "aria-busy": isLoadingDetails,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
                    title: release$1.name,
                    subtitle: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 2,
                        lineHeight: 6,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "neutral600",
                                variant: "epsilon",
                                children: numberOfEntriesText + (isScheduled ? ` - ${scheduledText}` : '')
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Badge, {
                                ...ReleasesPage.getBadgeProps(release$1.status),
                                children: release$1.status
                            })
                        ]
                    }),
                    navigationAction: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.BackButton, {
                        fallback: ".."
                    }),
                    primaryAction: !release$1.releasedAt && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(SimpleMenuButton, {
                                label: /*#__PURE__*/ jsxRuntime.jsx(icons.More, {}),
                                variant: "tertiary",
                                endIcon: null,
                                paddingLeft: "7px",
                                paddingRight: "7px",
                                "aria-label": formatMessage({
                                    id: 'content-releases.header.actions.open-release-actions',
                                    defaultMessage: 'Release edit and delete menu'
                                }),
                                popoverPlacement: "bottom-end",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                        disabled: !canUpdate,
                                        onSelect: toggleEditReleaseModal,
                                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {}),
                                        children: formatMessage({
                                            id: 'content-releases.header.actions.edit',
                                            defaultMessage: 'Edit'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                        disabled: !canDelete,
                                        onSelect: toggleWarningSubmit,
                                        variant: "danger",
                                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {}),
                                        children: formatMessage({
                                            id: 'content-releases.header.actions.delete',
                                            defaultMessage: 'Delete'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsxs(ReleaseInfoWrapper, {
                                        direction: "column",
                                        justifyContent: "center",
                                        alignItems: "flex-start",
                                        gap: 1,
                                        padding: 4,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "pi",
                                                fontWeight: "bold",
                                                children: formatMessage({
                                                    id: 'content-releases.header.actions.created',
                                                    defaultMessage: 'Created'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                                variant: "pi",
                                                color: "neutral300",
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(RelativeTime.RelativeTime, {
                                                        timestamp: new Date(release$1.createdAt)
                                                    }),
                                                    formatMessage({
                                                        id: 'content-releases.header.actions.created.description',
                                                        defaultMessage: '{hasCreatedByUser, select, true { by {createdBy}} other { by deleted user}}'
                                                    }, {
                                                        createdBy: getCreatedByUser(),
                                                        hasCreatedByUser
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                size: "S",
                                variant: "tertiary",
                                onClick: handleRefresh,
                                children: formatMessage({
                                    id: 'content-releases.header.actions.refresh',
                                    defaultMessage: 'Refresh'
                                })
                            }),
                            canPublish ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                size: "S",
                                variant: "default",
                                onClick: handlePublishRelease(release$1.id.toString()),
                                loading: isPublishing,
                                disabled: release$1.actions.meta.count === 0,
                                children: formatMessage({
                                    id: 'content-releases.header.actions.publish',
                                    defaultMessage: 'Publish'
                                })
                            }) : null
                        ]
                    })
                }),
                children
            ]
        })
    });
};
const SimpleMenuButton = styledComponents.styled(designSystem.SimpleMenu)`
  & > span {
    display: flex;
  }
`;
/* -------------------------------------------------------------------------------------------------
 * ReleaseDetailsBody
 * -----------------------------------------------------------------------------------------------*/ const GROUP_BY_OPTIONS = [
    'contentType',
    'locale',
    'action'
];
const GROUP_BY_OPTIONS_NO_LOCALE = [
    'contentType',
    'action'
];
const getGroupByOptionLabel = (value)=>{
    if (value === 'locale') {
        return {
            id: 'content-releases.pages.ReleaseDetails.groupBy.option.locales',
            defaultMessage: 'Locales'
        };
    }
    if (value === 'action') {
        return {
            id: 'content-releases.pages.ReleaseDetails.groupBy.option.actions',
            defaultMessage: 'Actions'
        };
    }
    return {
        id: 'content-releases.pages.ReleaseDetails.groupBy.option.content-type',
        defaultMessage: 'Content-Types'
    };
};
const ReleaseDetailsBody = ({ releaseId })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }, setQuery] = strapiAdmin.useQueryParams();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { data: releaseData, isLoading: isReleaseLoading, error: releaseError } = release.useGetReleaseQuery({
        id: releaseId
    });
    const { allowedActions: { canUpdate } } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    const runHookWaterfall = strapiAdmin.useStrapiApp('ReleaseDetailsPage', (state)=>state.runHookWaterfall);
    // TODO: Migrated displayedHeader to v5
    const { displayedHeaders, hasI18nEnabled } = runHookWaterfall('ContentReleases/pages/ReleaseDetails/add-locale-in-releases', {
        displayedHeaders: [
            {
                label: {
                    id: 'content-releases.page.ReleaseDetails.table.header.label.name',
                    defaultMessage: 'name'
                },
                name: 'name'
            }
        ],
        hasI18nEnabled: false
    });
    const release$1 = releaseData?.data;
    const selectedGroupBy = query?.groupBy || 'contentType';
    const { isLoading, isFetching, isError, data, error: releaseActionsError } = release.useGetReleaseActionsQuery({
        ...query,
        releaseId
    });
    const [updateReleaseAction] = release.useUpdateReleaseActionMutation();
    const handleChangeType = async (e, actionId, actionPath)=>{
        const response = await updateReleaseAction({
            params: {
                releaseId,
                actionId
            },
            body: {
                type: e.target.value
            },
            query,
            actionPath
        });
        if ('error' in response) {
            if (strapiAdmin.isFetchError(response.error)) {
                // When the response returns an object with 'error', handle fetch error
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(response.error)
                });
            } else {
                // Otherwise, the response returns an object with 'error', handle a generic error
                toggleNotification({
                    type: 'danger',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'An error occurred'
                    })
                });
            }
        }
    };
    if (isLoading || isReleaseLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    const releaseActions = data?.data;
    const releaseMeta = data?.meta;
    const contentTypes = releaseMeta?.contentTypes || {};
    releaseMeta?.components || {};
    if (api.isBaseQueryError(releaseError) || !release$1) {
        const errorsArray = [];
        if (releaseError && 'code' in releaseError) {
            errorsArray.push({
                code: releaseError.code
            });
        }
        if (releaseActionsError && 'code' in releaseActionsError) {
            errorsArray.push({
                code: releaseActionsError.code
            });
        }
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "..",
            state: {
                errors: errorsArray
            }
        });
    }
    if (isError || !releaseActions) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Error, {});
    }
    if (Object.keys(releaseActions).length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                action: /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                    tag: reactRouterDom.Link,
                    to: {
                        pathname: '/content-manager'
                    },
                    style: {
                        textDecoration: 'none'
                    },
                    variant: "secondary",
                    children: formatMessage({
                        id: 'content-releases.page.Details.button.openContentManager',
                        defaultMessage: 'Open the Content Manager'
                    })
                }),
                icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
                    width: "16rem"
                }),
                content: formatMessage({
                    id: 'content-releases.pages.Details.tab.emptyEntries',
                    defaultMessage: 'This release is empty. Open the Content Manager, select an entry and add it to the release.'
                })
            })
        });
    }
    const groupByLabel = formatMessage({
        id: 'content-releases.pages.ReleaseDetails.groupBy.aria-label',
        defaultMessage: 'Group by'
    });
    const headers = [
        ...displayedHeaders,
        {
            label: {
                id: 'content-releases.page.ReleaseDetails.table.header.label.content-type',
                defaultMessage: 'content-type'
            },
            name: 'content-type'
        },
        {
            label: {
                id: 'content-releases.page.ReleaseDetails.table.header.label.action',
                defaultMessage: 'action'
            },
            name: 'action'
        },
        ...!release$1.releasedAt ? [
            {
                label: {
                    id: 'content-releases.page.ReleaseDetails.table.header.label.status',
                    defaultMessage: 'status'
                },
                name: 'status'
            }
        ] : []
    ];
    const options = hasI18nEnabled ? GROUP_BY_OPTIONS : GROUP_BY_OPTIONS_NO_LOCALE;
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 4,
            direction: "column",
            alignItems: "stretch",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                        placeholder: groupByLabel,
                        "aria-label": groupByLabel,
                        customizeContent: (value)=>formatMessage({
                                id: `content-releases.pages.ReleaseDetails.groupBy.label`,
                                defaultMessage: `Group by {groupBy}`
                            }, {
                                groupBy: value
                            }),
                        value: formatMessage(getGroupByOptionLabel(selectedGroupBy)),
                        onChange: (value)=>setQuery({
                                groupBy: value
                            }),
                        children: options.map((option)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                value: option,
                                children: formatMessage(getGroupByOptionLabel(option))
                            }, option))
                    })
                }),
                Object.keys(releaseActions).map((key)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 4,
                        direction: "column",
                        alignItems: "stretch",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                role: "separator",
                                "aria-label": key,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Badge, {
                                    children: key
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Root, {
                                rows: releaseActions[key].map((item)=>({
                                        ...item,
                                        id: Number(item.entry.id)
                                    })),
                                headers: headers,
                                isLoading: isLoading || isFetching,
                                children: /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Table.Content, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Head, {
                                            children: headers.map(({ label, name })=>/*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.HeaderCell, {
                                                    label: formatMessage(label),
                                                    name: name
                                                }, name))
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Loading, {}),
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Body, {
                                            children: releaseActions[key].map(({ id, contentType, locale, type, entry, status }, actionIndex)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                            width: "25%",
                                                            maxWidth: "200px",
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                ellipsis: true,
                                                                children: `${contentType.mainFieldValue || entry.id}`
                                                            })
                                                        }),
                                                        hasI18nEnabled && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                            width: "10%",
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                children: `${locale?.name ? locale.name : '-'}`
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                            width: "10%",
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                children: contentType.displayName || ''
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                            width: "20%",
                                                            children: release$1.releasedAt ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                children: formatMessage({
                                                                    id: 'content-releases.page.ReleaseDetails.table.action-published',
                                                                    defaultMessage: 'This entry was <b>{isPublish, select, true {published} other {unpublished}}</b>.'
                                                                }, {
                                                                    isPublish: type === 'publish',
                                                                    b: (children)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                            fontWeight: "bold",
                                                                            children: children
                                                                        })
                                                                })
                                                            }) : /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionOptions.ReleaseActionOptions, {
                                                                selected: type,
                                                                handleChange: (e)=>handleChangeType(e, id, [
                                                                        key,
                                                                        actionIndex
                                                                    ]),
                                                                name: `release-action-${id}-type`,
                                                                disabled: !canUpdate
                                                            })
                                                        }),
                                                        !release$1.releasedAt && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                                            children: [
                                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                                    width: "20%",
                                                                    minWidth: "200px",
                                                                    children: /*#__PURE__*/ jsxRuntime.jsx(EntryValidationPopover.EntryValidationPopover, {
                                                                        action: type,
                                                                        schema: contentTypes?.[contentType.uid],
                                                                        entry: entry,
                                                                        status: status
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                                                        justifyContent: "flex-end",
                                                                        children: /*#__PURE__*/ jsxRuntime.jsxs(ReleaseActionMenu.ReleaseActionMenu.Root, {
                                                                            children: [
                                                                                /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionMenu.ReleaseActionMenu.ReleaseActionEntryLinkItem, {
                                                                                    contentTypeUid: contentType.uid,
                                                                                    documentId: entry.documentId,
                                                                                    locale: locale?.code
                                                                                }),
                                                                                /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionMenu.ReleaseActionMenu.DeleteReleaseActionItem, {
                                                                                    releaseId: release$1.id,
                                                                                    actionId: id
                                                                                })
                                                                            ]
                                                                        })
                                                                    })
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                }, id))
                                        })
                                    ]
                                })
                            })
                        ]
                    }, `releases-group-${key}`)),
                releaseMeta?.pagination?.pageCount && releaseMeta.pagination.pageCount > 1 && /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Pagination.Root, {
                    ...releaseMeta?.pagination,
                    defaultPageSize: releaseMeta?.pagination?.pageSize,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Pagination.PageSize, {}),
                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Pagination.Links, {})
                    ]
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * ReleaseDetailsPage
 * -----------------------------------------------------------------------------------------------*/ const ReleaseDetailsPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { releaseId } = reactRouterDom.useParams();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const navigate = reactRouterDom.useNavigate();
    const [releaseModalShown, setReleaseModalShown] = React__namespace.useState(false);
    const [showWarningSubmit, setWarningSubmit] = React__namespace.useState(false);
    const { isLoading: isLoadingDetails, data, isSuccess: isSuccessDetails } = release.useGetReleaseQuery({
        id: releaseId
    }, {
        skip: !releaseId
    });
    const { data: dataTimezone, isLoading: isLoadingTimezone } = release.useGetReleaseSettingsQuery();
    const [updateRelease, { isLoading: isSubmittingForm }] = release.useUpdateReleaseMutation();
    const [deleteRelease] = release.useDeleteReleaseMutation();
    const toggleEditReleaseModal = ()=>{
        setReleaseModalShown((prev)=>!prev);
    };
    const getTimezoneValue = ()=>{
        if (releaseData?.timezone) {
            return releaseData.timezone;
        } else {
            if (dataTimezone?.data.defaultTimezone) {
                return dataTimezone.data.defaultTimezone;
            }
            return null;
        }
    };
    const toggleWarningSubmit = ()=>setWarningSubmit((prevState)=>!prevState);
    if (isLoadingDetails || isLoadingTimezone) {
        return /*#__PURE__*/ jsxRuntime.jsx(ReleaseDetailsLayout, {
            toggleEditReleaseModal: toggleEditReleaseModal,
            toggleWarningSubmit: toggleWarningSubmit,
            children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {})
        });
    }
    if (!releaseId) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: ".."
        });
    }
    const releaseData = isSuccessDetails && data?.data || null;
    const title = releaseData?.name || '';
    const timezone = getTimezoneValue();
    const scheduledAt = releaseData?.scheduledAt && timezone ? dateFnsTz.utcToZonedTime(releaseData.scheduledAt, timezone) : null;
    // Just get the date and time to display without considering updated timezone time
    const date = scheduledAt ? format(scheduledAt, 'yyyy-MM-dd') : undefined;
    const time = scheduledAt ? format(scheduledAt, 'HH:mm') : '';
    const handleEditRelease = async (values)=>{
        const response = await updateRelease({
            id: releaseId,
            name: values.name,
            scheduledAt: values.scheduledAt,
            timezone: values.timezone
        });
        if ('data' in response) {
            // When the response returns an object with 'data', handle success
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'content-releases.modal.release-updated-notification-success',
                    defaultMessage: 'Release updated.'
                })
            });
            toggleEditReleaseModal();
        } else if (strapiAdmin.isFetchError(response.error)) {
            // When the response returns an object with 'error', handle fetch error
            toggleNotification({
                type: 'danger',
                message: formatAPIError(response.error)
            });
        } else {
            // Otherwise, the response returns an object with 'error', handle a generic error
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const handleDeleteRelease = async ()=>{
        const response = await deleteRelease({
            id: releaseId
        });
        if ('data' in response) {
            navigate('..');
        } else if (strapiAdmin.isFetchError(response.error)) {
            // When the response returns an object with 'error', handle fetch error
            toggleNotification({
                type: 'danger',
                message: formatAPIError(response.error)
            });
        } else {
            // Otherwise, the response returns an object with 'error', handle a generic error
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(ReleaseDetailsLayout, {
        toggleEditReleaseModal: toggleEditReleaseModal,
        toggleWarningSubmit: toggleWarningSubmit,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(ReleaseDetailsBody, {
                releaseId: releaseId
            }),
            /*#__PURE__*/ jsxRuntime.jsx(ReleaseModal.ReleaseModal, {
                open: releaseModalShown,
                handleClose: toggleEditReleaseModal,
                handleSubmit: handleEditRelease,
                isLoading: isLoadingDetails || isSubmittingForm,
                initialValues: {
                    name: title || '',
                    scheduledAt,
                    date,
                    time,
                    isScheduled: Boolean(scheduledAt),
                    timezone
                }
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                open: showWarningSubmit,
                onOpenChange: toggleWarningSubmit,
                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                    onConfirm: handleDeleteRelease,
                    children: formatMessage({
                        id: 'content-releases.dialog.confirmation-message',
                        defaultMessage: 'Are you sure you want to delete this release?'
                    })
                })
            })
        ]
    });
};

exports.ReleaseDetailsPage = ReleaseDetailsPage;
//# sourceMappingURL=ReleaseDetailsPage.js.map
