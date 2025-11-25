'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var constants = require('../constants.js');
var release = require('../services/release.js');
var time = require('../utils/time.js');
var ReleaseActionMenu = require('./ReleaseActionMenu.js');

const Panel = ({ model, document, documentId, collectionType })=>{
    const [{ query }] = strapiAdmin.useQueryParams();
    const locale = query.plugins?.i18n?.locale;
    const { edit: { options } } = strapiAdmin$1.unstable_useDocumentLayout(model);
    const { formatMessage, formatDate, formatTime } = reactIntl.useIntl();
    const { allowedActions } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    const { canRead, canDeleteAction } = allowedActions;
    const response = release.useGetReleasesForEntryQuery({
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
        content: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 3,
            width: "100%",
            children: releases?.map((release)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "column",
                    alignItems: "start",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: getReleaseColorVariant(release.actions[0].type, '200'),
                    overflow: "hidden",
                    hasRadius: true,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 4,
                            paddingRight: 4,
                            background: getReleaseColorVariant(release.actions[0].type, '100'),
                            width: "100%",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            padding: 4,
                            direction: "column",
                            gap: 2,
                            width: "100%",
                            alignItems: "flex-start",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    fontSize: 2,
                                    fontWeight: "bold",
                                    variant: "omega",
                                    textColor: "neutral700",
                                    children: release.name
                                }),
                                release.scheduledAt && release.timezone && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                                        offset: time.getTimezoneOffset(release.timezone, new Date(release.scheduledAt))
                                    })
                                }),
                                canDeleteAction ? /*#__PURE__*/ jsxRuntime.jsxs(ReleaseActionMenu.ReleaseActionMenu.Root, {
                                    hasTriggerBorder: true,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionMenu.ReleaseActionMenu.EditReleaseItem, {
                                            releaseId: release.id
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(ReleaseActionMenu.ReleaseActionMenu.DeleteReleaseActionItem, {
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

exports.Panel = Panel;
//# sourceMappingURL=ReleasesPanel.js.map
