'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var constants = require('../utils/constants.js');
var Step = require('./Step.js');

/* -------------------------------------------------------------------------------------------------
 * Step Components
 * -----------------------------------------------------------------------------------------------*/ const Introduction = ({ Step })=>/*#__PURE__*/ jsxRuntime.jsxs(Step.Root, {
        side: "top",
        sideOffset: 32,
        withArrow: false,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Step.Title, {
                id: "tours.apiTokens.Introduction.title",
                defaultMessage: "Last but not least, API tokens"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step.Content, {
                id: "tours.apiTokens.Introduction.content",
                defaultMessage: "Control API access with highly customizable permissions."
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step.Actions, {
                showSkip: true
            })
        ]
    });
const ManageAPIToken = ({ Step })=>/*#__PURE__*/ jsxRuntime.jsxs(Step.Root, {
        side: "bottom",
        align: "end",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Step.Title, {
                id: "tours.apiTokens.ManageAPIToken.title",
                defaultMessage: "Manage an API token"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step.Content, {
                id: "tours.apiTokens.ManageAPIToken.content",
                defaultMessage: 'Click the "Pencil" icon to view and update an existing API token.'
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step.Actions, {})
        ]
    });
const ViewAPIToken = ({ Step: Step$1, dispatch })=>/*#__PURE__*/ jsxRuntime.jsxs(Step$1.Root, {
        side: "bottom",
        align: "end",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Step$1.Title, {
                id: "tours.apiTokens.ViewAPIToken.title",
                defaultMessage: "View API token"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step$1.Content, {
                id: "tours.apiTokens.ViewAPIToken.content",
                defaultMessage: 'Click the "View token" button to see your API token.'
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(Step$1.Actions, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Step.StepCount, {
                        tourName: "apiTokens"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Step.GotItAction, {
                        onClick: ()=>dispatch({
                                type: 'next_step',
                                payload: 'apiTokens'
                            })
                    })
                ]
            })
        ]
    });
const CopyAPIToken = ({ Step: Step$1, dispatch })=>/*#__PURE__*/ jsxRuntime.jsxs(Step$1.Root, {
        side: "bottom",
        align: "start",
        sideOffset: -5,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Step$1.Title, {
                id: "tours.apiTokens.CopyAPIToken.title",
                defaultMessage: "Copy your new API token"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step$1.Content, {
                id: "tours.apiTokens.CopyAPIToken.content",
                defaultMessage: "Copy your API token",
                values: {
                    spacer: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 2
                    }),
                    a: (msg)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            isExternal: true,
                            href: "https://docs.strapi.io/cms/features/api-tokens#usage",
                            children: msg
                        })
                }
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(Step$1.Actions, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Step.StepCount, {
                        tourName: "apiTokens"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Step.GotItAction, {
                        onClick: ()=>dispatch({
                                type: 'next_step',
                                payload: 'apiTokens'
                            })
                    })
                ]
            })
        ]
    });
const Finish = ({ Step })=>/*#__PURE__*/ jsxRuntime.jsxs(Step.Root, {
        side: "right",
        align: "start",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Step.Title, {
                id: "tours.apiTokens.FinalStep.title",
                defaultMessage: "Congratulations, it's time to deploy your application!"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step.Content, {
                id: "tours.apiTokens.FinalStep.content",
                defaultMessage: "Your application is ready to be deployed and its content to be shared with the world!"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Step.Actions, {
                showPrevious: false,
                showStepCount: false,
                to: "/"
            })
        ]
    });
/* -------------------------------------------------------------------------------------------------
 * Steps
 * -----------------------------------------------------------------------------------------------*/ const apiTokensSteps = [
    {
        name: 'Introduction',
        content: Introduction
    },
    {
        name: 'ManageAPIToken',
        content: ManageAPIToken
    },
    {
        name: 'ViewAPIToken',
        content: ViewAPIToken
    },
    {
        name: 'CopyAPIToken',
        content: CopyAPIToken
    },
    {
        name: 'Finish',
        content: Finish,
        excludeFromStepCount: true,
        when: (completedActions)=>completedActions.includes(constants.GUIDED_TOUR_REQUIRED_ACTIONS.apiTokens.copyToken)
    }
];

exports.apiTokensSteps = apiTokensSteps;
//# sourceMappingURL=ApiTokensSteps.js.map
