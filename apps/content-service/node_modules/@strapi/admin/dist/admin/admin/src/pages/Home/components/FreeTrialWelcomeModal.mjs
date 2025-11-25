import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Modal, Button, Box, Flex, Typography } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { useLicenseLimits } from '../../../../../ee/admin/src/hooks/useLicenseLimits.mjs';
import img from '../../../assets/images/free-trial.png.mjs';
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

  > span {
    line-height: 0;
  }
`;
const FreeTrialWelcomeModal = ()=>{
    const { formatMessage } = useIntl();
    const [open, setOpen] = useState(true);
    const [previouslyOpen, setPreviouslyOpen] = useScopedPersistentState('STRAPI_FREE_TRIAL_WELCOME_MODAL', false);
    const { license } = useLicenseLimits();
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
    if (previouslyOpen || !license?.isTrial) {
        return null;
    }
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
                            variant: "tertiary",
                            width: "2.4rem",
                            height: "2.4rem",
                            onClick: handleClose,
                            children: /*#__PURE__*/ jsx(Cross, {})
                        })
                    }),
                    /*#__PURE__*/ jsx("img", {
                        src: img,
                        alt: "free-trial",
                        width: "100%",
                        height: "100%"
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
                                    id: 'app.components.FreeTrialWelcomeModal.title',
                                    defaultMessage: "We're glad to have you on board"
                                })
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                children: formatMessage({
                                    id: 'app.components.FreeTrialWelcomeModal.description1',
                                    defaultMessage: 'For the next 30 days, you will have full access to advanced features like Content History, Releases and Single Sign-On (SSO) – everything you need to explore the power of Strapi CMS.'
                                })
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                children: formatMessage({
                                    id: 'app.components.FreeTrialWelcomeModal.description2',
                                    defaultMessage: 'Use this time to build, customize, and test your content workflows with complete flexibility!'
                                })
                            }),
                            /*#__PURE__*/ jsx(Box, {
                                marginTop: 4,
                                children: /*#__PURE__*/ jsx(Button, {
                                    onClick: handleClose,
                                    children: formatMessage({
                                        id: 'app.components.FreeTrialWelcomeModal.button',
                                        defaultMessage: 'Start exploring'
                                    })
                                })
                            })
                        ]
                    })
                ]
            })
        })
    });
};

export { FreeTrialWelcomeModal };
//# sourceMappingURL=FreeTrialWelcomeModal.mjs.map
