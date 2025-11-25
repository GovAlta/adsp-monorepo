'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var getTranslation = require('../utils/getTranslation.js');
var strings = require('../utils/strings.js');

const isErrorMessageDescriptor = (object)=>{
    return typeof object === 'object' && object !== null && 'id' in object && 'defaultMessage' in object;
};
const EntryValidationText = ({ status = 'draft', validationErrors, action })=>{
    const { formatMessage } = reactIntl.useIntl();
    /**
   * TODO: Should this be extracted an made into a factory to recursively get
   * error messages??
   */ const getErrorStr = (key, value)=>{
        if (typeof value === 'string') {
            return `${key}: ${value}`;
        } else if (isErrorMessageDescriptor(value)) {
            return `${key}: ${formatMessage(value)}`;
        } else if (Array.isArray(value)) {
            return value.map((v)=>getErrorStr(key, v)).join(' ');
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            return Object.entries(value).map(([k, v])=>getErrorStr(k, v)).join(' ');
        } else {
            /**
       * unlikely to happen, but we need to return something
       */ return '';
        }
    };
    if (validationErrors) {
        const validationErrorsMessages = Object.entries(validationErrors).map(([key, value])=>{
            return getErrorStr(key, value);
        }).join(' ');
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.CrossCircle, {
                    fill: "danger600"
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                    label: validationErrorsMessages,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        maxWidth: '30rem',
                        textColor: "danger600",
                        variant: "omega",
                        fontWeight: "semiBold",
                        ellipsis: true,
                        children: validationErrorsMessages
                    })
                })
            ]
        });
    }
    const getStatusMessage = ()=>{
        if (action === 'bulk-publish') {
            if (status === 'published') {
                return {
                    icon: /*#__PURE__*/ jsxRuntime.jsx(icons.CheckCircle, {
                        fill: "success600"
                    }),
                    text: formatMessage({
                        id: 'content-manager.bulk-publish.already-published',
                        defaultMessage: 'Already Published'
                    }),
                    textColor: 'success600',
                    fontWeight: 'bold'
                };
            } else if (status === 'modified') {
                return {
                    icon: /*#__PURE__*/ jsxRuntime.jsx(icons.ArrowsCounterClockwise, {
                        fill: "alternative600"
                    }),
                    text: formatMessage({
                        id: 'app.utils.ready-to-publish-changes',
                        defaultMessage: 'Ready to publish changes'
                    })
                };
            } else {
                return {
                    icon: /*#__PURE__*/ jsxRuntime.jsx(icons.CheckCircle, {
                        fill: "success600"
                    }),
                    text: formatMessage({
                        id: 'app.utils.ready-to-publish',
                        defaultMessage: 'Ready to publish'
                    })
                };
            }
        } else {
            if (status === 'draft') {
                return {
                    icon: /*#__PURE__*/ jsxRuntime.jsx(icons.CheckCircle, {
                        fill: "success600"
                    }),
                    text: formatMessage({
                        id: 'content-manager.bulk-unpublish.already-unpublished',
                        defaultMessage: 'Already Unpublished'
                    }),
                    textColor: 'success600',
                    fontWeight: 'bold'
                };
            } else {
                return {
                    icon: /*#__PURE__*/ jsxRuntime.jsx(icons.CheckCircle, {
                        fill: "success600"
                    }),
                    text: formatMessage({
                        id: 'app.utils.ready-to-unpublish-changes',
                        defaultMessage: 'Ready to unpublish'
                    }),
                    textColor: 'success600',
                    fontWeight: 'bold'
                };
            }
        }
    };
    const { icon, text, textColor = 'success600', fontWeight = 'normal' } = getStatusMessage();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 2,
        children: [
            icon,
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: textColor,
                fontWeight: fontWeight,
                children: text
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * BoldChunk
 * -----------------------------------------------------------------------------------------------*/ const BoldChunk = (chunks)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        fontWeight: "bold",
        children: chunks
    });
const BulkLocaleActionModal = ({ headers, rows, localesMetadata, validationErrors = {}, action })=>{
    const { formatMessage } = reactIntl.useIntl();
    const selectedRows = strapiAdmin.useTable('BulkLocaleActionModal', (state)=>state.selectedRows);
    const getFormattedCountMessage = ()=>{
        const currentStatusByLocale = rows.reduce((acc, { locale, status })=>{
            acc[locale] = status;
            return acc;
        }, {});
        const localesWithErrors = Object.keys(validationErrors);
        const publishedCount = selectedRows.filter(({ locale })=>currentStatusByLocale[locale] === 'published').length;
        const draftCount = selectedRows.filter(({ locale })=>(currentStatusByLocale[locale] === 'draft' || currentStatusByLocale[locale] === 'modified') && !localesWithErrors.includes(locale)).length;
        const withErrorsCount = localesWithErrors.length;
        const messageId = action === 'bulk-publish' ? 'content-manager.containers.list.selectedEntriesModal.selectedCount.publish' : 'content-manager.containers.list.selectedEntriesModal.selectedCount.unpublish';
        const defaultMessage = action === 'bulk-publish' ? '<b>{publishedCount}</b> {publishedCount, plural, =0 {entries} one {entry} other {entries}} already published. <b>{draftCount}</b> {draftCount, plural, =0 {entries} one {entry} other {entries}} ready to publish. <b>{withErrorsCount}</b> {withErrorsCount, plural, =0 {entries} one {entry} other {entries}} waiting for action.' : '<b>{draftCount}</b> {draftCount, plural, =0 {entries} one {entry} other {entries}} already unpublished. <b>{publishedCount}</b> {publishedCount, plural, =0 {entries} one {entry} other {entries}} ready to unpublish.';
        return formatMessage({
            id: messageId,
            defaultMessage
        }, {
            withErrorsCount,
            draftCount,
            publishedCount,
            b: BoldChunk
        });
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Body, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                children: getFormattedCountMessage()
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                marginTop: 5,
                children: /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Table.Content, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Table.Head, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.HeaderCheckboxCell, {}),
                                headers.map((head)=>/*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.HeaderCell, {
                                        ...head
                                    }, head.name))
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Body, {
                            children: rows.map(({ locale, status }, index)=>{
                                const error = validationErrors?.[locale] ?? null;
                                const statusVariant = status === 'draft' ? 'primary' : status === 'published' ? 'success' : 'alternative';
                                return /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Table.Row, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.CheckboxCell, {
                                            id: locale,
                                            "aria-label": `Select ${locale}`
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "sigma",
                                                textColor: "neutral600",
                                                children: Array.isArray(localesMetadata) ? localesMetadata.find((localeEntry)=>localeEntry.code === locale)?.name : locale
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                display: "flex",
                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Status, {
                                                    display: "flex",
                                                    paddingLeft: "6px",
                                                    paddingRight: "6px",
                                                    paddingTop: "2px",
                                                    paddingBottom: "2px",
                                                    size: 'S',
                                                    variant: statusVariant,
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        tag: "span",
                                                        variant: "pi",
                                                        fontWeight: "bold",
                                                        children: strings.capitalize(status)
                                                    })
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(EntryValidationText, {
                                                validationErrors: error,
                                                status: status,
                                                action: action
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Table.Cell, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                                tag: reactRouterDom.Link,
                                                to: {
                                                    search: qs.stringify({
                                                        plugins: {
                                                            i18n: {
                                                                locale
                                                            }
                                                        }
                                                    })
                                                },
                                                label: formatMessage({
                                                    id: getTranslation.getTranslation('Settings.list.actions.edit'),
                                                    defaultMessage: 'Edit {name} locale'
                                                }, {
                                                    name: locale
                                                }),
                                                variant: "ghost",
                                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                            })
                                        })
                                    ]
                                }, index);
                            })
                        })
                    ]
                })
            })
        ]
    });
};

exports.BulkLocaleActionModal = BulkLocaleActionModal;
//# sourceMappingURL=BulkLocaleActionModal.js.map
