import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotification, useAPIErrorHandler, Page, ConfirmDialog, useRBAC, useTracking, Layouts, BackButton, useQueryParams, useStrapiApp, Table, Pagination, isFetchError } from '@strapi/admin/strapi-admin';
import { Flex, SimpleMenu, Dialog, Main, Typography, Badge, Menu, Button, EmptyStateLayout, LinkButton, SingleSelect, SingleSelectOption, Tr, Td } from '@strapi/design-system';
import { More, Pencil, Trash } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import format from 'date-fns/format';
import { utcToZonedTime } from 'date-fns-tz';
import { useIntl } from 'react-intl';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { styled } from 'styled-components';
import { EntryValidationPopover } from '../components/EntryValidationPopover.mjs';
import { RelativeTime } from '../components/RelativeTime.mjs';
import { ReleaseActionMenu } from '../components/ReleaseActionMenu.mjs';
import { ReleaseActionOptions } from '../components/ReleaseActionOptions.mjs';
import { ReleaseModal } from '../components/ReleaseModal.mjs';
import { PERMISSIONS } from '../constants.mjs';
import { useGetReleaseQuery, useGetReleaseSettingsQuery, useUpdateReleaseMutation, useDeleteReleaseMutation, usePublishReleaseMutation, useGetReleaseActionsQuery, useUpdateReleaseActionMutation, releaseApi } from '../services/release.mjs';
import { useTypedDispatch } from '../store/hooks.mjs';
import { isBaseQueryError } from '../utils/api.mjs';
import { getTimezoneOffset } from '../utils/time.mjs';
import { getBadgeProps } from './ReleasesPage.mjs';

/* -------------------------------------------------------------------------------------------------
 * ReleaseDetailsLayout
 * -----------------------------------------------------------------------------------------------*/ const ReleaseInfoWrapper = styled(Flex)`
  align-self: stretch;
  border-bottom-right-radius: ${({ theme })=>theme.borderRadius};
  border-bottom-left-radius: ${({ theme })=>theme.borderRadius};
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const ReleaseDetailsLayout = ({ toggleEditReleaseModal, toggleWarningSubmit, children })=>{
    const { formatMessage, formatDate, formatTime } = useIntl();
    const { releaseId } = useParams();
    const { data, isLoading: isLoadingDetails, error } = useGetReleaseQuery({
        id: releaseId
    }, {
        skip: !releaseId
    });
    const [publishRelease, { isLoading: isPublishing }] = usePublishReleaseMutation();
    const { toggleNotification } = useNotification();
    const { formatAPIError } = useAPIErrorHandler();
    const { allowedActions } = useRBAC(PERMISSIONS);
    const { canUpdate, canDelete, canPublish } = allowedActions;
    const dispatch = useTypedDispatch();
    const { trackUsage } = useTracking();
    const release = data?.data;
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
            } else if (isFetchError(response.error)) {
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
        dispatch(releaseApi.util.invalidateTags([
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
        if (!release?.createdBy) {
            return null;
        }
        // Favor the username
        if (release.createdBy.username) {
            return release.createdBy.username;
        }
        // Firstname may not exist if created with SSO
        if (release.createdBy.firstname) {
            return `${release.createdBy.firstname} ${release.createdBy.lastname || ''}`.trim();
        }
        // All users must have at least an email
        return release.createdBy.email;
    };
    if (isLoadingDetails) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    if (isBaseQueryError(error) && 'code' in error || !release) {
        return /*#__PURE__*/ jsx(Navigate, {
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
    const totalEntries = release.actions.meta.count || 0;
    const hasCreatedByUser = Boolean(getCreatedByUser());
    const isScheduled = release.scheduledAt && release.timezone;
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
        date: formatDate(new Date(release.scheduledAt), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: release.timezone
        }),
        time: formatTime(new Date(release.scheduledAt), {
            timeZone: release.timezone,
            hourCycle: 'h23'
        }),
        offset: getTimezoneOffset(release.timezone, new Date(release.scheduledAt))
    }) : '';
    return /*#__PURE__*/ jsx(Layouts.Root, {
        children: /*#__PURE__*/ jsxs(Main, {
            "aria-busy": isLoadingDetails,
            children: [
                /*#__PURE__*/ jsx(Layouts.Header, {
                    title: release.name,
                    subtitle: /*#__PURE__*/ jsxs(Flex, {
                        gap: 2,
                        lineHeight: 6,
                        children: [
                            /*#__PURE__*/ jsx(Typography, {
                                textColor: "neutral600",
                                variant: "epsilon",
                                children: numberOfEntriesText + (isScheduled ? ` - ${scheduledText}` : '')
                            }),
                            /*#__PURE__*/ jsx(Badge, {
                                ...getBadgeProps(release.status),
                                children: release.status
                            })
                        ]
                    }),
                    navigationAction: /*#__PURE__*/ jsx(BackButton, {
                        fallback: ".."
                    }),
                    primaryAction: !release.releasedAt && /*#__PURE__*/ jsxs(Flex, {
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsxs(SimpleMenuButton, {
                                label: /*#__PURE__*/ jsx(More, {}),
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
                                    /*#__PURE__*/ jsx(Menu.Item, {
                                        disabled: !canUpdate,
                                        onSelect: toggleEditReleaseModal,
                                        startIcon: /*#__PURE__*/ jsx(Pencil, {}),
                                        children: formatMessage({
                                            id: 'content-releases.header.actions.edit',
                                            defaultMessage: 'Edit'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Menu.Item, {
                                        disabled: !canDelete,
                                        onSelect: toggleWarningSubmit,
                                        variant: "danger",
                                        startIcon: /*#__PURE__*/ jsx(Trash, {}),
                                        children: formatMessage({
                                            id: 'content-releases.header.actions.delete',
                                            defaultMessage: 'Delete'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxs(ReleaseInfoWrapper, {
                                        direction: "column",
                                        justifyContent: "center",
                                        alignItems: "flex-start",
                                        gap: 1,
                                        padding: 4,
                                        children: [
                                            /*#__PURE__*/ jsx(Typography, {
                                                variant: "pi",
                                                fontWeight: "bold",
                                                children: formatMessage({
                                                    id: 'content-releases.header.actions.created',
                                                    defaultMessage: 'Created'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxs(Typography, {
                                                variant: "pi",
                                                color: "neutral300",
                                                children: [
                                                    /*#__PURE__*/ jsx(RelativeTime, {
                                                        timestamp: new Date(release.createdAt)
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
                            /*#__PURE__*/ jsx(Button, {
                                size: "S",
                                variant: "tertiary",
                                onClick: handleRefresh,
                                children: formatMessage({
                                    id: 'content-releases.header.actions.refresh',
                                    defaultMessage: 'Refresh'
                                })
                            }),
                            canPublish ? /*#__PURE__*/ jsx(Button, {
                                size: "S",
                                variant: "default",
                                onClick: handlePublishRelease(release.id.toString()),
                                loading: isPublishing,
                                disabled: release.actions.meta.count === 0,
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
const SimpleMenuButton = styled(SimpleMenu)`
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
    const { formatMessage } = useIntl();
    const [{ query }, setQuery] = useQueryParams();
    const { toggleNotification } = useNotification();
    const { formatAPIError } = useAPIErrorHandler();
    const { data: releaseData, isLoading: isReleaseLoading, error: releaseError } = useGetReleaseQuery({
        id: releaseId
    });
    const { allowedActions: { canUpdate } } = useRBAC(PERMISSIONS);
    const runHookWaterfall = useStrapiApp('ReleaseDetailsPage', (state)=>state.runHookWaterfall);
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
    const release = releaseData?.data;
    const selectedGroupBy = query?.groupBy || 'contentType';
    const { isLoading, isFetching, isError, data, error: releaseActionsError } = useGetReleaseActionsQuery({
        ...query,
        releaseId
    });
    const [updateReleaseAction] = useUpdateReleaseActionMutation();
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
            if (isFetchError(response.error)) {
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    const releaseActions = data?.data;
    const releaseMeta = data?.meta;
    const contentTypes = releaseMeta?.contentTypes || {};
    releaseMeta?.components || {};
    if (isBaseQueryError(releaseError) || !release) {
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
        return /*#__PURE__*/ jsx(Navigate, {
            to: "..",
            state: {
                errors: errorsArray
            }
        });
    }
    if (isError || !releaseActions) {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    if (Object.keys(releaseActions).length === 0) {
        return /*#__PURE__*/ jsx(Layouts.Content, {
            children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                action: /*#__PURE__*/ jsx(LinkButton, {
                    tag: Link,
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
                icon: /*#__PURE__*/ jsx(EmptyDocuments, {
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
        ...!release.releasedAt ? [
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
    return /*#__PURE__*/ jsx(Layouts.Content, {
        children: /*#__PURE__*/ jsxs(Flex, {
            gap: 4,
            direction: "column",
            alignItems: "stretch",
            children: [
                /*#__PURE__*/ jsx(Flex, {
                    children: /*#__PURE__*/ jsx(SingleSelect, {
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
                        children: options.map((option)=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                value: option,
                                children: formatMessage(getGroupByOptionLabel(option))
                            }, option))
                    })
                }),
                Object.keys(releaseActions).map((key)=>/*#__PURE__*/ jsxs(Flex, {
                        gap: 4,
                        direction: "column",
                        alignItems: "stretch",
                        children: [
                            /*#__PURE__*/ jsx(Flex, {
                                role: "separator",
                                "aria-label": key,
                                children: /*#__PURE__*/ jsx(Badge, {
                                    children: key
                                })
                            }),
                            /*#__PURE__*/ jsx(Table.Root, {
                                rows: releaseActions[key].map((item)=>({
                                        ...item,
                                        id: Number(item.entry.id)
                                    })),
                                headers: headers,
                                isLoading: isLoading || isFetching,
                                children: /*#__PURE__*/ jsxs(Table.Content, {
                                    children: [
                                        /*#__PURE__*/ jsx(Table.Head, {
                                            children: headers.map(({ label, name })=>/*#__PURE__*/ jsx(Table.HeaderCell, {
                                                    label: formatMessage(label),
                                                    name: name
                                                }, name))
                                        }),
                                        /*#__PURE__*/ jsx(Table.Loading, {}),
                                        /*#__PURE__*/ jsx(Table.Body, {
                                            children: releaseActions[key].map(({ id, contentType, locale, type, entry, status }, actionIndex)=>/*#__PURE__*/ jsxs(Tr, {
                                                    children: [
                                                        /*#__PURE__*/ jsx(Td, {
                                                            width: "25%",
                                                            maxWidth: "200px",
                                                            children: /*#__PURE__*/ jsx(Typography, {
                                                                ellipsis: true,
                                                                children: `${contentType.mainFieldValue || entry.id}`
                                                            })
                                                        }),
                                                        hasI18nEnabled && /*#__PURE__*/ jsx(Td, {
                                                            width: "10%",
                                                            children: /*#__PURE__*/ jsx(Typography, {
                                                                children: `${locale?.name ? locale.name : '-'}`
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(Td, {
                                                            width: "10%",
                                                            children: /*#__PURE__*/ jsx(Typography, {
                                                                children: contentType.displayName || ''
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(Td, {
                                                            width: "20%",
                                                            children: release.releasedAt ? /*#__PURE__*/ jsx(Typography, {
                                                                children: formatMessage({
                                                                    id: 'content-releases.page.ReleaseDetails.table.action-published',
                                                                    defaultMessage: 'This entry was <b>{isPublish, select, true {published} other {unpublished}}</b>.'
                                                                }, {
                                                                    isPublish: type === 'publish',
                                                                    b: (children)=>/*#__PURE__*/ jsx(Typography, {
                                                                            fontWeight: "bold",
                                                                            children: children
                                                                        })
                                                                })
                                                            }) : /*#__PURE__*/ jsx(ReleaseActionOptions, {
                                                                selected: type,
                                                                handleChange: (e)=>handleChangeType(e, id, [
                                                                        key,
                                                                        actionIndex
                                                                    ]),
                                                                name: `release-action-${id}-type`,
                                                                disabled: !canUpdate
                                                            })
                                                        }),
                                                        !release.releasedAt && /*#__PURE__*/ jsxs(Fragment, {
                                                            children: [
                                                                /*#__PURE__*/ jsx(Td, {
                                                                    width: "20%",
                                                                    minWidth: "200px",
                                                                    children: /*#__PURE__*/ jsx(EntryValidationPopover, {
                                                                        action: type,
                                                                        schema: contentTypes?.[contentType.uid],
                                                                        entry: entry,
                                                                        status: status
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ jsx(Td, {
                                                                    children: /*#__PURE__*/ jsx(Flex, {
                                                                        justifyContent: "flex-end",
                                                                        children: /*#__PURE__*/ jsxs(ReleaseActionMenu.Root, {
                                                                            children: [
                                                                                /*#__PURE__*/ jsx(ReleaseActionMenu.ReleaseActionEntryLinkItem, {
                                                                                    contentTypeUid: contentType.uid,
                                                                                    documentId: entry.documentId,
                                                                                    locale: locale?.code
                                                                                }),
                                                                                /*#__PURE__*/ jsx(ReleaseActionMenu.DeleteReleaseActionItem, {
                                                                                    releaseId: release.id,
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
                releaseMeta?.pagination?.pageCount && releaseMeta.pagination.pageCount > 1 && /*#__PURE__*/ jsxs(Pagination.Root, {
                    ...releaseMeta?.pagination,
                    defaultPageSize: releaseMeta?.pagination?.pageSize,
                    children: [
                        /*#__PURE__*/ jsx(Pagination.PageSize, {}),
                        /*#__PURE__*/ jsx(Pagination.Links, {})
                    ]
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * ReleaseDetailsPage
 * -----------------------------------------------------------------------------------------------*/ const ReleaseDetailsPage = ()=>{
    const { formatMessage } = useIntl();
    const { releaseId } = useParams();
    const { toggleNotification } = useNotification();
    const { formatAPIError } = useAPIErrorHandler();
    const navigate = useNavigate();
    const [releaseModalShown, setReleaseModalShown] = React.useState(false);
    const [showWarningSubmit, setWarningSubmit] = React.useState(false);
    const { isLoading: isLoadingDetails, data, isSuccess: isSuccessDetails } = useGetReleaseQuery({
        id: releaseId
    }, {
        skip: !releaseId
    });
    const { data: dataTimezone, isLoading: isLoadingTimezone } = useGetReleaseSettingsQuery();
    const [updateRelease, { isLoading: isSubmittingForm }] = useUpdateReleaseMutation();
    const [deleteRelease] = useDeleteReleaseMutation();
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
        return /*#__PURE__*/ jsx(ReleaseDetailsLayout, {
            toggleEditReleaseModal: toggleEditReleaseModal,
            toggleWarningSubmit: toggleWarningSubmit,
            children: /*#__PURE__*/ jsx(Page.Loading, {})
        });
    }
    if (!releaseId) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: ".."
        });
    }
    const releaseData = isSuccessDetails && data?.data || null;
    const title = releaseData?.name || '';
    const timezone = getTimezoneValue();
    const scheduledAt = releaseData?.scheduledAt && timezone ? utcToZonedTime(releaseData.scheduledAt, timezone) : null;
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
        } else if (isFetchError(response.error)) {
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
        } else if (isFetchError(response.error)) {
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
    return /*#__PURE__*/ jsxs(ReleaseDetailsLayout, {
        toggleEditReleaseModal: toggleEditReleaseModal,
        toggleWarningSubmit: toggleWarningSubmit,
        children: [
            /*#__PURE__*/ jsx(ReleaseDetailsBody, {
                releaseId: releaseId
            }),
            /*#__PURE__*/ jsx(ReleaseModal, {
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
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: showWarningSubmit,
                onOpenChange: toggleWarningSubmit,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
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

export { ReleaseDetailsPage };
//# sourceMappingURL=ReleaseDetailsPage.mjs.map
