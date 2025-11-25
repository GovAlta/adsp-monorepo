import { jsx, jsxs } from 'react/jsx-runtime';
import { useQueryParams, useRBAC } from '@strapi/admin/strapi-admin';
import { unstable_useDocumentLayout } from '@strapi/content-manager/strapi-admin';
import { Flex, Box, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { PERMISSIONS } from '../constants.mjs';
import { useGetReleasesForEntryQuery } from '../services/release.mjs';
import { getTimezoneOffset } from '../utils/time.mjs';
import { ReleaseActionMenu } from './ReleaseActionMenu.mjs';

const Panel = ({ model, document, documentId, collectionType })=>{
    const [{ query }] = useQueryParams();
    const locale = query.plugins?.i18n?.locale;
    const { edit: { options } } = unstable_useDocumentLayout(model);
    const { formatMessage, formatDate, formatTime } = useIntl();
    const { allowedActions } = useRBAC(PERMISSIONS);
    const { canRead, canDeleteAction } = allowedActions;
    const response = useGetReleasesForEntryQuery({
        contentType: model,
        entryDocumentId: documentId,
        locale,
        hasEntryAttached: true
    }, {
        skip: !document
    });
    const releases = response.data?.data;
    const getReleaseColorVariant = (actionType, shade)=>{
        if (actionType === 'unpublish') {
            return `secondary${shade}`;
        }
        return `success${shade}`;
    };
    // Project is not EE or contentType does not have draftAndPublish enabled
    if (!window.strapi.isEE || !options?.draftAndPublish || !canRead) {
        return null;
    }
    if (collectionType === 'collection-types' && (!documentId || documentId === 'create')) {
        return null;
    }
    if (!releases || releases.length === 0) {
        return null;
    }
    return {
        title: formatMessage({
            id: 'content-releases.plugin.name',
            defaultMessage: 'Releases'
        }),
        content: /*#__PURE__*/ jsx(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 3,
            width: "100%",
            children: releases?.map((release)=>/*#__PURE__*/ jsxs(Flex, {
                    direction: "column",
                    alignItems: "start",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: getReleaseColorVariant(release.actions[0].type, '200'),
                    overflow: "hidden",
                    hasRadius: true,
                    children: [
                        /*#__PURE__*/ jsx(Box, {
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 4,
                            paddingRight: 4,
                            background: getReleaseColorVariant(release.actions[0].type, '100'),
                            width: "100%",
                            children: /*#__PURE__*/ jsx(Typography, {
                                fontSize: 1,
                                variant: "pi",
                                textColor: getReleaseColorVariant(release.actions[0].type, '600'),
                                children: formatMessage({
                                    id: 'content-releases.content-manager-edit-view.list-releases.title',
                                    defaultMessage: '{isPublish, select, true {Will be published in} other {Will be unpublished in}}'
                                }, {
                                    isPublish: release.actions[0].type === 'publish'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            padding: 4,
                            direction: "column",
                            gap: 2,
                            width: "100%",
                            alignItems: "flex-start",
                            children: [
                                /*#__PURE__*/ jsx(Typography, {
                                    fontSize: 2,
                                    fontWeight: "bold",
                                    variant: "omega",
                                    textColor: "neutral700",
                                    children: release.name
                                }),
                                release.scheduledAt && release.timezone && /*#__PURE__*/ jsx(Typography, {
                                    variant: "pi",
                                    textColor: "neutral600",
                                    children: formatMessage({
                                        id: 'content-releases.content-manager-edit-view.scheduled.date',
                                        defaultMessage: '{date} at {time} ({offset})'
                                    }, {
                                        date: formatDate(new Date(release.scheduledAt), {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            timeZone: release.timezone
                                        }),
                                        time: formatTime(new Date(release.scheduledAt), {
                                            hourCycle: 'h23',
                                            timeZone: release.timezone
                                        }),
                                        offset: getTimezoneOffset(release.timezone, new Date(release.scheduledAt))
                                    })
                                }),
                                canDeleteAction ? /*#__PURE__*/ jsxs(ReleaseActionMenu.Root, {
                                    hasTriggerBorder: true,
                                    children: [
                                        /*#__PURE__*/ jsx(ReleaseActionMenu.EditReleaseItem, {
                                            releaseId: release.id
                                        }),
                                        /*#__PURE__*/ jsx(ReleaseActionMenu.DeleteReleaseActionItem, {
                                            releaseId: release.id,
                                            actionId: release.actions[0].id
                                        })
                                    ]
                                }) : null
                            ]
                        })
                    ]
                }, release.id))
        })
    };
};

export { Panel };
//# sourceMappingURL=ReleasesPanel.mjs.map
