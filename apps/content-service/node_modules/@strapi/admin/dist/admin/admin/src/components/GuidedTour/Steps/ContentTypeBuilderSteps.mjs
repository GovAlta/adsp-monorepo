import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import 'react';
import { useParams } from 'react-router-dom';
import { useAIAvailability } from '../../../hooks/useAIAvailability.mjs';
import { useGetGuidedTourMetaQuery } from '../../../services/admin.mjs';
import { useGuidedTour } from '../Context.mjs';
import { tours } from '../Tours.mjs';
import { GUIDED_TOUR_REQUIRED_ACTIONS } from '../utils/constants.mjs';
import { GotItAction, StepCount, DefaultActions } from './Step.mjs';

const ContentTypeBuilderActions = ({ ...props })=>{
    const state = useGuidedTour('ContentTypeBuilderActions', (s)=>s.state);
    const dispatch = useGuidedTour('ContentTypeBuilderActions', (s)=>s.dispatch);
    const isAIEnabled = useAIAvailability();
    const currentStepOffset = state.tours.contentTypeBuilder.currentStep + 1;
    const displayedCurrentStep = (()=>{
        if (!isAIEnabled && currentStepOffset > contentTypeBuilderStepsAI.length) {
            // If AI is not enabled, we remove the AI steps
            return currentStepOffset - contentTypeBuilderStepsAI.length;
        } else if (isAIEnabled && currentStepOffset > contentTypeBuilderStepsNoAI.length) {
            // If AI is enabled, we remove the non-AI steps
            return currentStepOffset - contentTypeBuilderStepsNoAI.length;
        }
        return currentStepOffset;
    })();
    // When AI is enabled, we subtract the no AI steps and vice versa
    const displayedTourLength = isAIEnabled ? tours.contentTypeBuilder._meta.displayedStepCount - contentTypeBuilderStepsNoAI.length : tours.contentTypeBuilder._meta.displayedStepCount - contentTypeBuilderStepsAI.length;
    const handleNextStep = ()=>{
        const currentStep = state.tours.contentTypeBuilder.currentStep;
        if (!isAIEnabled && currentStep === 0) {
            // If AI is disabled, after Introduction (step 0), skip AI steps and go to first NoAI step
            const nextStep = 1 + contentTypeBuilderStepsAI.length; // Skip AI steps
            dispatch({
                type: 'go_to_step',
                payload: {
                    tourName: 'contentTypeBuilder',
                    step: nextStep
                }
            });
        } else if (isAIEnabled && currentStep === contentTypeBuilderStepsAI.length) {
            // If AI is enabled, after AI steps, skip NoAI steps and go to Save/Finish
            const nextStep = 1 + contentTypeBuilderStepsAI.length + contentTypeBuilderStepsNoAI.length;
            dispatch({
                type: 'go_to_step',
                payload: {
                    tourName: 'contentTypeBuilder',
                    step: nextStep
                }
            });
        } else {
            // Normal step progression
            dispatch({
                type: 'next_step',
                payload: 'contentTypeBuilder'
            });
        }
    };
    const handlePreviousStep = ()=>{
        const currentStep = state.tours.contentTypeBuilder.currentStep;
        if (!isAIEnabled && currentStep === 1 + contentTypeBuilderStepsAI.length) {
            // If AI is disabled and we're at the first NoAI step, go back to Introduction (step 0)
            dispatch({
                type: 'go_to_step',
                payload: {
                    tourName: 'contentTypeBuilder',
                    step: 0
                }
            });
        } else if (isAIEnabled && currentStep === 1 + contentTypeBuilderStepsAI.length + contentTypeBuilderStepsNoAI.length) {
            // If AI is enabled and we're at Save/Finish, go back to last AI step
            dispatch({
                type: 'go_to_step',
                payload: {
                    tourName: 'contentTypeBuilder',
                    step: contentTypeBuilderStepsAI.length
                }
            });
        } else {
            // Normal step progression
            dispatch({
                type: 'previous_step',
                payload: 'contentTypeBuilder'
            });
        }
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(StepCount, {
                tourName: "contentTypeBuilder",
                displayedCurrentStep: displayedCurrentStep,
                displayedTourLength: displayedTourLength
            }),
            props.children || /*#__PURE__*/ jsx(DefaultActions, {
                tourName: "contentTypeBuilder",
                onNextStep: handleNextStep,
                onPreviousStep: handlePreviousStep,
                ...props
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Step Components
 * -----------------------------------------------------------------------------------------------*/ const Introduction = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        sideOffset: 33,
        withArrow: false,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.Introduction.title",
                defaultMessage: "Content-Type Builder"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.Introduction.content",
                defaultMessage: "Create and manage your content structure with collection types, single types and components."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showSkip: true
                })
            })
        ]
    });
const AIChat = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "left",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.AIChat.title",
                defaultMessage: "Time to get started!"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.AIChat.content",
                defaultMessage: "<p>If you have any questions about the Content-Type Builder or Strapi ask them here.</p><p>Strapi AI can generate schemas tailored to your needs. Ask for exactly what you want, for example:<ul><li>Date picker</li><li>Email and password fields</li><li>Media of any type</li><li>UIDs</li></ul></p><p>Don’t be shy, try it out !</p>"
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true
                })
            })
        ]
    });
const CollectionTypes = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        sideOffset: 16,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.CollectionTypes.title",
                defaultMessage: "Collection Types"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.CollectionTypes.content",
                defaultMessage: "A content structure that can manage multiple entries, such as articles or products."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true
                })
            })
        ]
    });
const SingleTypes = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        sideOffset: 16,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.SingleTypes.title",
                defaultMessage: "Single Types"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.SingleTypes.content",
                defaultMessage: "A content structure that can manage a single entry, such as a homepage or a header."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true
                })
            })
        ]
    });
const Components = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        sideOffset: 16,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.Components.title",
                defaultMessage: "Components"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.Components.content",
                defaultMessage: "A reusable content structure that can be used across multiple content types, such as buttons, sliders or cards."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true
                })
            })
        ]
    });
const YourTurn = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        sideOffset: 16,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.YourTurn.title",
                defaultMessage: "Your turn"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.YourTurn.content",
                defaultMessage: "Create a collection type or single type and configure it."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true
                })
            })
        ]
    });
const AddFields = ({ Step, dispatch })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "bottom",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.AddFields.title",
                defaultMessage: "Don't forget to add a field to your content type"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.AddFields.content",
                defaultMessage: "Add the fields your content needs such as text, media and relations."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true,
                    children: /*#__PURE__*/ jsx(GotItAction, {
                        onClick: ()=>dispatch({
                                type: 'next_step',
                                payload: 'contentTypeBuilder'
                            })
                    })
                })
            })
        ]
    });
const Save = ({ Step, dispatch })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.Save.title",
                defaultMessage: "Save before you leave!"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.Save.content",
                defaultMessage: "Save the changes you made here before leaving this page."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentTypeBuilderActions, {
                    showPrevious: true,
                    children: /*#__PURE__*/ jsx(GotItAction, {
                        onClick: ()=>{
                            // Ensure the completed action is removed
                            // in the event the user already has a schema but is still doing the tour
                            dispatch({
                                type: 'remove_completed_action',
                                payload: GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.createSchema
                            });
                            dispatch({
                                type: 'next_step',
                                payload: 'contentTypeBuilder'
                            });
                        }
                    })
                })
            })
        ]
    });
const Finish = ({ Step })=>{
    const { data: guidedTourMeta } = useGetGuidedTourMetaQuery();
    const { '*': routeParams } = useParams();
    // Get the uid from the params
    const uid = routeParams?.split('/').pop();
    const contentType = uid ? guidedTourMeta?.data?.schemas?.[uid] : null;
    const contentTypeKindDictionary = {
        collectionType: 'collection-types',
        singleType: 'single-types'
    };
    const to = contentType ? `/content-manager/${contentTypeKindDictionary[contentType.kind]}/${contentType.uid}` : '/content-manager';
    return /*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentTypeBuilder.Finish.title",
                defaultMessage: "First Step: Done! 🎉"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentTypeBuilder.Finish.content",
                defaultMessage: "You've built your first content type! Now head over to the Content Manager to start adding entries!"
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                showStepCount: false,
                showPrevious: false,
                to: to
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Steps
 * -----------------------------------------------------------------------------------------------*/ const contentTypeBuilderStepsAI = [
    {
        name: 'AIChat',
        content: AIChat
    }
];
const contentTypeBuilderStepsNoAI = [
    {
        name: 'CollectionTypes',
        content: CollectionTypes
    },
    {
        name: 'SingleTypes',
        content: SingleTypes
    },
    {
        name: 'Components',
        content: Components
    },
    {
        name: 'YourTurn',
        content: YourTurn
    },
    {
        name: 'AddFields',
        content: AddFields
    }
];
const contentTypeBuilderSteps = [
    {
        name: 'Introduction',
        content: Introduction
    },
    ...contentTypeBuilderStepsAI,
    ...contentTypeBuilderStepsNoAI,
    {
        name: 'Save',
        when: (completedActions)=>completedActions.includes(GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.addField),
        content: Save
    },
    {
        name: 'Finish',
        content: Finish,
        excludeFromStepCount: true,
        when: (completedActions)=>completedActions.includes(GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.createSchema)
    }
];

export { contentTypeBuilderSteps };
//# sourceMappingURL=ContentTypeBuilderSteps.mjs.map
