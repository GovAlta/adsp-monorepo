import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useParams } from 'react-router-dom';
import { useGuidedTour } from '../Context.mjs';
import { tours } from '../Tours.mjs';
import { GUIDED_TOUR_REQUIRED_ACTIONS } from '../utils/constants.mjs';
import { StepCount, GotItAction, DefaultActions } from './Step.mjs';

const ContentManagerActions = ({ isActionRequired = false, ...props })=>{
    const { collectionType } = useParams();
    const state = useGuidedTour('ContentManagerActions', (s)=>s.state);
    const dispatch = useGuidedTour('ContentManagerActions', (s)=>s.dispatch);
    const isSingleType = collectionType === 'single-types';
    const currentStepOffset = state.tours.contentManager.currentStep + 1;
    const displayedCurrentStep = (()=>{
        if (isSingleType && currentStepOffset > collectionTypeSpecificSteps.length) {
            return currentStepOffset - collectionTypeSpecificSteps.length;
        }
        return currentStepOffset;
    })();
    // For single types we subtract all contentTypeSpecificSteps
    const displayedTourLength = isSingleType ? tours.contentManager._meta.displayedStepCount - collectionTypeSpecificSteps.length : tours.contentManager._meta.displayedStepCount;
    const handleNextStep = ()=>{
        if (isSingleType && state.tours.contentManager.currentStep === 0) {
            // The tours diverge after the first step, on next click skip all the collection type specific steps
            dispatch({
                type: 'go_to_step',
                payload: {
                    tourName: 'contentManager',
                    step: collectionTypeSpecificSteps.length + 1
                }
            });
        } else {
            dispatch({
                type: 'next_step',
                payload: 'contentManager'
            });
        }
    };
    const handlePreviousStep = ()=>{
        if (isSingleType && // Check the currentStep is the step after the collection type specific steps
        state.tours.contentManager.currentStep === collectionTypeSpecificSteps.length + 1) {
            dispatch({
                type: 'go_to_step',
                payload: {
                    tourName: 'contentManager',
                    // Go to the step just before the collection type specific steps
                    step: state.tours.contentManager.currentStep - collectionTypeSpecificSteps.length - 1
                }
            });
        } else {
            dispatch({
                type: 'previous_step',
                payload: 'contentManager'
            });
        }
    };
    if (isActionRequired) {
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(StepCount, {
                    tourName: "contentManager",
                    displayedCurrentStep: displayedCurrentStep,
                    displayedTourLength: displayedTourLength
                }),
                /*#__PURE__*/ jsx(GotItAction, {
                    onClick: handleNextStep
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(StepCount, {
                tourName: "contentManager",
                displayedCurrentStep: displayedCurrentStep,
                displayedTourLength: displayedTourLength
            }),
            /*#__PURE__*/ jsx(DefaultActions, {
                tourName: "contentManager",
                onNextStep: handleNextStep,
                onPreviousStep: handlePreviousStep,
                ...props
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Step Components
 * -----------------------------------------------------------------------------------------------*/ const Introduction = ({ Step })=>{
    return /*#__PURE__*/ jsxs(Step.Root, {
        side: "top",
        sideOffset: 33,
        withArrow: false,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentManager.Introduction.title",
                defaultMessage: "Content manager"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentManager.Introduction.content",
                defaultMessage: "Create and manage content from your collection types and single types."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentManagerActions, {
                    showSkip: true
                })
            })
        ]
    });
};
const CreateNewEntry = ({ Step })=>{
    return /*#__PURE__*/ jsxs(Step.Root, {
        side: "bottom",
        align: "end",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentManager.CreateNewEntry.title",
                defaultMessage: "Create new entry"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentManager.CreateNewEntry.content",
                defaultMessage: 'Click the "Create new entry" button to create and publish a new entry for this collection type.'
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentManagerActions, {
                    showPrevious: true
                })
            })
        ]
    });
};
const Fields = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        sideOffset: -12,
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentManager.Fields.title",
                defaultMessage: "Fields"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentManager.Fields.content",
                defaultMessage: "First, fill in the fields you created in the Content-Type Builder."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentManagerActions, {
                    showPrevious: true
                })
            })
        ]
    });
const Publish = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "left",
        align: "center",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentManager.Publish.title",
                defaultMessage: "Publish"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentManager.Publish.content",
                defaultMessage: 'Then click the "Publish" button to make your content available through the content API.'
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                children: /*#__PURE__*/ jsx(ContentManagerActions, {
                    isActionRequired: true
                })
            })
        ]
    });
const Finish = ({ Step })=>/*#__PURE__*/ jsxs(Step.Root, {
        side: "right",
        children: [
            /*#__PURE__*/ jsx(Step.Title, {
                id: "tours.contentManager.FinalStep.title",
                defaultMessage: "Time to setup API tokens!"
            }),
            /*#__PURE__*/ jsx(Step.Content, {
                id: "tours.contentManager.FinalStep.content",
                defaultMessage: "Now that you've created and published an entry, let's setup an API token to manage access to your content."
            }),
            /*#__PURE__*/ jsx(Step.Actions, {
                showStepCount: false,
                showPrevious: false,
                to: "/settings/api-tokens"
            })
        ]
    });
/* -------------------------------------------------------------------------------------------------
 * Steps
 * -----------------------------------------------------------------------------------------------*/ const collectionTypeSpecificSteps = [
    {
        name: 'CreateNewEntry',
        content: CreateNewEntry
    }
];
const contentManagerSteps = [
    {
        name: 'Introduction',
        when: (completedActions)=>completedActions.includes(GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.createSchema),
        content: Introduction
    },
    ...collectionTypeSpecificSteps,
    {
        name: 'Fields',
        content: Fields
    },
    {
        name: 'Publish',
        content: Publish
    },
    {
        name: 'Finish',
        content: Finish,
        excludeFromStepCount: true,
        when: (completedActions)=>completedActions.includes(GUIDED_TOUR_REQUIRED_ACTIONS.contentManager.createContent)
    }
];

export { contentManagerSteps };
//# sourceMappingURL=ContentManagerSteps.mjs.map
