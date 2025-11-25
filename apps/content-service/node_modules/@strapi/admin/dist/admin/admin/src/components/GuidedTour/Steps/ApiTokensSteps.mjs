import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Box, Link } from '@strapi/design-system';
import { GUIDED_TOUR_REQUIRED_ACTIONS } from '../utils/constants.mjs';
import { StepCount, GotItAction } from './Step.mjs';

/* -------------------------------------------------------------------------------------------------
 * Step Components
 * -----------------------------------------------------------------------------------------------*/ const Introduction = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "top",
        sideOffset: 32,
        withArrow: false,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.apiTokens.Introduction.title",
                defaultMessage: "Last but not least, API tokens"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.apiTokens.Introduction.content",
                defaultMessage: "Control API access with highly customizable permissions."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                showSkip: true
            })
        ]
    });
const ManageAPIToken = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "bottom",
        align: "end",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.apiTokens.ManageAPIToken.title",
                defaultMessage: "Manage an API token"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.apiTokens.ManageAPIToken.content",
                defaultMessage: 'Click the "Pencil" icon to view and update an existing API token.'
            }),
            /*#__PURE__*/ jsx(Step.Actions, {})
        ]
    });
const ViewAPIToken = ({ Step, dispatch })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "bottom",
        align: "end",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.apiTokens.ViewAPIToken.title",
                defaultMessage: "View API token"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.apiTokens.ViewAPIToken.content",
                defaultMessage: 'Click the "View token" button to see your API token.'
            }),
            /*#__PURE__*/ jsxs(Step.Actions, {
                children: [
                    /*#__PURE__*/ jsx(StepCount, {
                        tourName: "apiTokens"
                    }),
                    /*#__PURE__*/ jsx(GotItAction, {
                        onClick: ()=>dispatch({
                                type: 'next_step',
                                payload: 'apiTokens'
                            })
                    })
                ]
            })
        ]
    });
const CopyAPIToken = ({ Step, dispatch })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "bottom",
        align: "start",
        sideOffset: -5,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.apiTokens.CopyAPIToken.title",
                defaultMessage: "Copy your new API token"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.apiTokens.CopyAPIToken.content",
                defaultMessage: "Copy your API token",
                values: {
                    spacer: /*#__PURE__*/ jsx(Box, {
                        paddingTop: 2
                    }),
                    a: (msg)=>/*#__PURE__*/ jsx(Link, {
                            isExternal: true,
                            href: "https://docs.strapi.io/cms/features/api-tokens#usage",
                            children: msg
                        })
                }
            }),
            /*#__PURE__*/ jsxs(Step.Actions, {
                children: [
                    /*#__PURE__*/ jsx(StepCount, {
                        tourName: "apiTokens"
                    }),
                    /*#__PURE__*/ jsx(GotItAction, {
                        onClick: ()=>dispatch({
                                type: 'next_step',
                                payload: 'apiTokens'
                            })
                    })
                ]
            })
        ]
    });
const Finish = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        align: "start",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.apiTokens.FinalStep.title",
                defaultMessage: "Congratulations, it's time to deploy your application!"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.apiTokens.FinalStep.content",
                defaultMessage: "Your application is ready to be deployed and its content to be shared with the world!"
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
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
        when: (completedActions)=>completedActions.includes(GUIDED_TOUR_REQUIRED_ACTIONS.apiTokens.copyToken)
    }
];

export { apiTokensSteps };
//# sourceMappingURL=ApiTokensSteps.mjs.map
