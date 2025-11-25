'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var useLicenseLimits = require('../../../../../ee/admin/src/hooks/useLicenseLimits.js');
var freeTrial = require('../../../assets/images/free-trial.png.js');
var usePersistentState = require('../../../hooks/usePersistentState.js');

const StyledModalContent = styled(designSystem.Modal.Content)`
  max-width: 51.6rem;
`;
const StyledModalBody = styled(designSystem.Modal.Body)`
  padding: 0;
  position: relative;

  > div {
    padding: 0;
  }
`;
const StyledButton = styled(designSystem.Button)`
  border: 0;
  border-radius: 50%;

  > span {
    line-height: 0;
  }
`;
const FreeTrialWelcomeModal = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const [open, setOpen] = React.useState(true);
    const [previouslyOpen, setPreviouslyOpen] = usePersistentState.useScopedPersistentState('STRAPI_FREE_TRIAL_WELCOME_MODAL', false);
    const { license } = useLicenseLimits.useLicenseLimits();
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: open,
        onOpenChange: handleOnOpenChange,
        children: /*#__PURE__*/ jsxRuntime.jsx(StyledModalContent, {
            "aria-labelledby": "title",
            children: /*#__PURE__*/ jsxRuntime.jsxs(StyledModalBody, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        position: "absolute",
                        top: 0,
                        right: 0,
                        padding: 2,
                        children: /*#__PURE__*/ jsxRuntime.jsx(StyledButton, {
                            "aria-label": formatMessage({
                                id: 'app.utils.close-label',
                                defaultMessage: 'Close'
                            }),
                            variant: "tertiary",
                            width: "2.4rem",
                            height: "2.4rem",
                            onClick: handleClose,
                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {})
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("img", {
                        src: freeTrial,
                        alt: "free-trial",
                        width: "100%",
                        height: "100%"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "column",
                        alignItems: "start",
                        justifyContent: "stretch",
                        padding: 8,
                        gap: 4,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "alpha",
                                fontWeight: "bold",
                                fontSize: 4,
                                id: "title",
                                children: formatMessage({
                                    id: 'app.components.FreeTrialWelcomeModal.title',
                                    defaultMessage: "We're glad to have you on board"
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                children: formatMessage({
                                    id: 'app.components.FreeTrialWelcomeModal.description1',
                                    defaultMessage: 'For the next 30 days, you will have full access to advanced features like Content History, Releases and Single Sign-On (SSO) – everything you need to explore the power of Strapi CMS.'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                children: formatMessage({
                                    id: 'app.components.FreeTrialWelcomeModal.description2',
                                    defaultMessage: 'Use this time to build, customize, and test your content workflows with complete flexibility!'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                marginTop: 4,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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

exports.FreeTrialWelcomeModal = FreeTrialWelcomeModal;
//# sourceMappingURL=FreeTrialWelcomeModal.js.map
