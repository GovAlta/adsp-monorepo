import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Modal, Button, Box, Flex, Typography, LinkButton } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { subDays, isAfter } from 'date-fns';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { useLicenseLimits } from '../../../../../ee/admin/src/hooks/useLicenseLimits.mjs';
import { useScopedPersistentState } from '../../../hooks/usePersistentState.mjs';

const StyledModalContent = styled(Modal.Content)`
  max-width: 51.6rem;
`;
const StyledModalBody = styled(Modal.Body)`
  padding: 0;
  position: relative;

  > div {
    padding: 0;
  }
`;
const StyledButton = styled(Button)`
  border: 0;
  border-radius: 50%;
`;
const FreeTrialEndedModal = ()=>{
    const { formatMessage } = useIntl();
    const [open, setOpen] = useState(true);
    const [previouslyOpen, setPreviouslyOpen] = useScopedPersistentState('STRAPI_FREE_TRIAL_ENDED_MODAL', false);
    const [cachedTrialEndsAt] = useScopedPersistentState('STRAPI_FREE_TRIAL_ENDS_AT', undefined);
    const { license } = useLicenseLimits();
    const sevenDaysAgo = subDays(new Date(), 7);
    // When the license is not a trial + not EE, and the cached trial end date is found in the localstorage, that means the trial has ended
    // We show the banner to encourage the user to upgrade (for 7 days after the trial ends)
    const isTrialEndedRecently = Boolean(!license?.isTrial && !window.strapi.isEE && cachedTrialEndsAt && isAfter(new Date(cachedTrialEndsAt), sevenDaysAgo));
    const handleClose = ()=>{
        setPreviouslyOpen(true);
        setOpen(false);
    };
    const handleOnOpenChange = (isOpen)=>{
        if (!isOpen) {
            setPreviouslyOpen(true);
        }
        setOpen(isOpen);
    };
    if (!previouslyOpen && isTrialEndedRecently) {
        return /*#__PURE__*/ jsx(Modal.Root, {
            open: open,
            onOpenChange: handleOnOpenChange,
            children: /*#__PURE__*/ jsx(StyledModalContent, {
                "aria-labelledby": "title",
                children: /*#__PURE__*/ jsxs(StyledModalBody, {
                    children: [
                        /*#__PURE__*/ jsx(Box, {
                            position: "absolute",
                            top: 0,
                            right: 0,
                            padding: 2,
                            children: /*#__PURE__*/ jsx(StyledButton, {
                                "aria-label": formatMessage({
                                    id: 'app.utils.close-label',
                                    defaultMessage: 'Close'
                                }),
                                variant: "ghost",
                                width: "2.4rem",
                                height: "2.4rem",
                                onClick: handleClose,
                                children: /*#__PURE__*/ jsx(Cross, {})
                            })
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "start",
                            justifyContent: "stretch",
                            padding: 8,
                            gap: 4,
                            children: [
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "alpha",
                                    fontWeight: "bold",
                                    fontSize: 4,
                                    id: "title",
                                    children: formatMessage({
                                        id: 'app.components.FreeTrialEndedModal.title',
                                        defaultMessage: 'Your trial has ended'
                                    })
                                }),
                                /*#__PURE__*/ jsx(Typography, {
                                    children: formatMessage({
                                        id: 'app.components.FreeTrialEndedModal.description',
                                        defaultMessage: 'Your access to Growth plan features such as Content history, Releases and Single sign-On (SSO) has expired.'
                                    })
                                }),
                                /*#__PURE__*/ jsxs(Box, {
                                    background: "primary200",
                                    padding: 4,
                                    hasRadius: true,
                                    children: [
                                        /*#__PURE__*/ jsx(Typography, {
                                            fontWeight: "bold",
                                            children: formatMessage({
                                                id: 'app.components.FreeTrialEndedModal.notice.title',
                                                defaultMessage: 'Important to know:'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxs("ul", {
                                            style: {
                                                listStyleType: 'disc',
                                                marginLeft: '1.5rem'
                                            },
                                            children: [
                                                /*#__PURE__*/ jsx("li", {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        children: formatMessage({
                                                            id: 'app.components.FreeTrialEndedModal.notice.item1',
                                                            defaultMessage: 'Downgrading will remove access to the above features.'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx("li", {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        children: formatMessage({
                                                            id: 'app.components.FreeTrialEndedModal.notice.item2',
                                                            defaultMessage: 'Document version history will be deleted.'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx("li", {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        children: formatMessage({
                                                            id: 'app.components.FreeTrialEndedModal.notice.item3',
                                                            defaultMessage: 'All releases will be erased.'
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx("li", {
                                                    children: /*#__PURE__*/ jsx(Typography, {
                                                        children: formatMessage({
                                                            id: 'app.components.FreeTrialEndedModal.notice.item4',
                                                            defaultMessage: 'If you downgrade ensure to set a root admin password to keep access to the admin panel.'
                                                        })
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsxs(Flex, {
                                    marginTop: 4,
                                    gap: 2,
                                    children: [
                                        /*#__PURE__*/ jsx(LinkButton, {
                                            href: "https://strapi.chargebeeportal.com/",
                                            target: "_blank",
                                            children: formatMessage({
                                                id: 'app.components.FreeTrialEndedModal.button.upgrade',
                                                defaultMessage: 'Stay on the Growth plan'
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Button, {
                                            variant: "tertiary",
                                            onClick: handleClose,
                                            children: formatMessage({
                                                id: 'app.components.FreeTrialEndedModal.button.downgrade',
                                                defaultMessage: 'Downgrade to Community'
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            })
        });
    }
    return null;
};

export { FreeTrialEndedModal };
//# sourceMappingURL=FreeTrialEndedModal.mjs.map
