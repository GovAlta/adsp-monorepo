import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { unstable_useDocument } from '@strapi/content-manager/strapi-admin';
import { Flex, Popover, Typography, LinkButton, Button } from '@strapi/design-system';
import { CrossCircle, CheckCircle, ArrowsCounterClockwise, CaretDown } from '@strapi/icons';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

const StyledPopoverFlex = styled(Flex)`
  width: 100%;
  max-width: 256px;

  & > * {
    border-bottom: 1px solid ${({ theme })=>theme.colors.neutral150};
  }

  & > *:last-child {
    border-bottom: none;
  }
`;
const ButtonContent = styled(Flex)`
  svg {
    fill: currentColor;
  }
`;
const CustomStatusButton = ({ children, icon, color })=>{
    return /*#__PURE__*/ jsx(Popover.Trigger, {
        children: /*#__PURE__*/ jsx(Button, {
            variant: "ghost",
            endIcon: /*#__PURE__*/ jsx(CaretDown, {}),
            children: /*#__PURE__*/ jsxs(ButtonContent, {
                color: color,
                gap: 2,
                children: [
                    icon,
                    /*#__PURE__*/ jsx(Typography, {
                        textColor: color,
                        variant: "omega",
                        fontWeight: "bold",
                        children: children
                    })
                ]
            })
        })
    });
};
const EntryStatusTrigger = ({ action, status, hasErrors, requiredStage, entryStage })=>{
    const { formatMessage } = useIntl();
    if (action === 'publish') {
        if (hasErrors || requiredStage && requiredStage.id !== entryStage?.id) {
            return /*#__PURE__*/ jsx(CustomStatusButton, {
                icon: /*#__PURE__*/ jsx(CrossCircle, {}),
                color: "danger600",
                children: formatMessage({
                    id: 'content-releases.pages.ReleaseDetails.entry-validation.not-ready',
                    defaultMessage: 'Not ready to publish'
                })
            });
        }
        if (status === 'draft') {
            return /*#__PURE__*/ jsx(CustomStatusButton, {
                icon: /*#__PURE__*/ jsx(CheckCircle, {}),
                color: "success600",
                children: formatMessage({
                    id: 'content-releases.pages.ReleaseDetails.entry-validation.ready-to-publish',
                    defaultMessage: 'Ready to publish'
                })
            });
        }
        if (status === 'modified') {
            return /*#__PURE__*/ jsx(CustomStatusButton, {
                icon: /*#__PURE__*/ jsx(ArrowsCounterClockwise, {}),
                color: "alternative600",
                children: formatMessage({
                    id: 'content-releases.pages.ReleaseDetails.entry-validation.modified',
                    defaultMessage: 'Ready to publish changes'
                })
            });
        }
        return /*#__PURE__*/ jsx(CustomStatusButton, {
            icon: /*#__PURE__*/ jsx(CheckCircle, {}),
            color: "success600",
            children: formatMessage({
                id: 'content-releases.pages.ReleaseDetails.entry-validation.already-published',
                defaultMessage: 'Already published'
            })
        });
    }
    if (status === 'published') {
        return /*#__PURE__*/ jsx(CustomStatusButton, {
            icon: /*#__PURE__*/ jsx(CheckCircle, {}),
            color: "success600",
            children: formatMessage({
                id: 'content-releases.pages.ReleaseDetails.entry-validation.ready-to-unpublish',
                defaultMessage: 'Ready to unpublish'
            })
        });
    }
    return /*#__PURE__*/ jsx(CustomStatusButton, {
        icon: /*#__PURE__*/ jsx(CheckCircle, {}),
        color: "success600",
        children: formatMessage({
            id: 'content-releases.pages.ReleaseDetails.entry-validation.already-unpublished',
            defaultMessage: 'Already unpublished'
        })
    });
};
const FieldsValidation = ({ hasErrors, errors, kind, contentTypeUid, documentId, locale })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 1,
        width: "100%",
        padding: 5,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                width: "100%",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        fontWeight: "bold",
                        children: formatMessage({
                            id: 'content-releases.pages.ReleaseDetails.entry-validation.fields',
                            defaultMessage: 'Fields'
                        })
                    }),
                    hasErrors ? /*#__PURE__*/ jsx(CrossCircle, {
                        fill: "danger600"
                    }) : /*#__PURE__*/ jsx(CheckCircle, {
                        fill: "success600"
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Typography, {
                width: "100%",
                textColor: "neutral600",
                children: hasErrors ? formatMessage({
                    id: 'content-releases.pages.ReleaseDetails.entry-validation.fields.error',
                    defaultMessage: '{errors} errors on fields.'
                }, {
                    errors: errors ? Object.keys(errors).length : 0
                }) : formatMessage({
                    id: 'content-releases.pages.ReleaseDetails.entry-validation.fields.success',
                    defaultMessage: 'All fields are filled correctly.'
                })
            }),
            hasErrors && /*#__PURE__*/ jsx(LinkButton, {
                tag: Link,
                to: {
                    pathname: `/content-manager/${kind === 'collectionType' ? 'collection-types' : 'single-types'}/${contentTypeUid}/${documentId}`,
                    search: locale ? stringify({
                        plugins: {
                            i18n: {
                                locale
                            }
                        }
                    }) : ''
                },
                variant: "secondary",
                fullWidth: true,
                state: {
                    forceValidation: true
                },
                children: formatMessage({
                    id: 'content-releases.pages.ReleaseDetails.entry-validation.fields.see-errors',
                    defaultMessage: 'See errors'
                })
            })
        ]
    });
};
const getReviewStageIcon = ({ contentTypeHasReviewWorkflow, requiredStage, entryStage })=>{
    if (!contentTypeHasReviewWorkflow) {
        return /*#__PURE__*/ jsx(CheckCircle, {
            fill: "neutral200"
        });
    }
    if (requiredStage && requiredStage.id !== entryStage?.id) {
        return /*#__PURE__*/ jsx(CrossCircle, {
            fill: "danger600"
        });
    }
    return /*#__PURE__*/ jsx(CheckCircle, {
        fill: "success600"
    });
};
const getReviewStageMessage = ({ contentTypeHasReviewWorkflow, requiredStage, entryStage, formatMessage })=>{
    if (!contentTypeHasReviewWorkflow) {
        return formatMessage({
            id: 'content-releases.pages.ReleaseDetails.entry-validation.review-stage.not-enabled',
            defaultMessage: 'This entry is not associated to any workflow.'
        });
    }
    if (requiredStage && requiredStage.id !== entryStage?.id) {
        return formatMessage({
            id: 'content-releases.pages.ReleaseDetails.entry-validation.review-stage.not-ready',
            defaultMessage: 'This entry is not at the required stage for publishing. ({stageName})'
        }, {
            stageName: requiredStage?.name ?? ''
        });
    }
    if (requiredStage && requiredStage.id === entryStage?.id) {
        return formatMessage({
            id: 'content-releases.pages.ReleaseDetails.entry-validation.review-stage.ready',
            defaultMessage: 'This entry is at the required stage for publishing. ({stageName})'
        }, {
            stageName: requiredStage?.name ?? ''
        });
    }
    return formatMessage({
        id: 'content-releases.pages.ReleaseDetails.entry-validation.review-stage.stage-not-required',
        defaultMessage: 'No required stage for publication'
    });
};
const ReviewStageValidation = ({ contentTypeHasReviewWorkflow, requiredStage, entryStage })=>{
    const { formatMessage } = useIntl();
    const Icon = getReviewStageIcon({
        contentTypeHasReviewWorkflow,
        requiredStage,
        entryStage
    });
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 1,
        width: "100%",
        padding: 5,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                width: "100%",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        fontWeight: "bold",
                        children: formatMessage({
                            id: 'content-releases.pages.ReleaseDetails.entry-validation.review-stage',
                            defaultMessage: 'Review stage'
                        })
                    }),
                    Icon
                ]
            }),
            /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                children: getReviewStageMessage({
                    contentTypeHasReviewWorkflow,
                    requiredStage,
                    entryStage,
                    formatMessage
                })
            })
        ]
    });
};
const EntryValidationPopover = ({ schema, entry, status, action })=>{
    const { validate, isLoading } = unstable_useDocument({
        collectionType: schema?.kind ?? '',
        model: schema?.uid ?? ''
    }, {
        // useDocument makes a request to get more data about the entry, but we only want to have the validation function so we skip the request
        skip: true
    });
    // Validation errors
    const errors = isLoading ? null : validate(entry);
    const hasErrors = errors ? Object.keys(errors).length > 0 : false;
    // Entry stage
    const contentTypeHasReviewWorkflow = schema?.hasReviewWorkflow ?? false;
    const requiredStage = schema?.stageRequiredToPublish;
    const entryStage = entry.strapi_stage;
    if (isLoading) {
        return null;
    }
    return /*#__PURE__*/ jsxs(Popover.Root, {
        children: [
            /*#__PURE__*/ jsx(EntryStatusTrigger, {
                action: action,
                status: status,
                hasErrors: hasErrors,
                requiredStage: requiredStage,
                entryStage: entryStage
            }),
            /*#__PURE__*/ jsx(Popover.Content, {
                children: /*#__PURE__*/ jsxs(StyledPopoverFlex, {
                    direction: "column",
                    children: [
                        /*#__PURE__*/ jsx(FieldsValidation, {
                            hasErrors: hasErrors,
                            errors: errors,
                            contentTypeUid: schema?.uid,
                            kind: schema?.kind,
                            documentId: entry.documentId,
                            locale: entry.locale
                        }),
                        /*#__PURE__*/ jsx(ReviewStageValidation, {
                            contentTypeHasReviewWorkflow: contentTypeHasReviewWorkflow,
                            requiredStage: requiredStage,
                            entryStage: entryStage
                        })
                    ]
                })
            })
        ]
    });
};

export { EntryValidationPopover };
//# sourceMappingURL=EntryValidationPopover.mjs.map
