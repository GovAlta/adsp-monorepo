import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Portal, Popover } from '@strapi/design-system';
import { styled } from 'styled-components';
import { useGetGuidedTourMetaQuery } from '../../services/admin.mjs';
import { useGuidedTour } from './Context.mjs';
import { apiTokensSteps } from './Steps/ApiTokensSteps.mjs';
import { contentManagerSteps } from './Steps/ContentManagerSteps.mjs';
import { contentTypeBuilderSteps } from './Steps/ContentTypeBuilderSteps.mjs';
import { createStepComponents } from './Steps/Step.mjs';
import { GUIDED_TOUR_REQUIRED_ACTIONS } from './utils/constants.mjs';

/* -------------------------------------------------------------------------------------------------
 * Tours
 * -----------------------------------------------------------------------------------------------*/ const tours = {
    contentTypeBuilder: createTour('contentTypeBuilder', contentTypeBuilderSteps),
    contentManager: createTour('contentManager', contentManagerSteps),
    apiTokens: createTour('apiTokens', apiTokensSteps),
    strapiCloud: createTour('strapiCloud', [])
};
const GuidedTourTooltip = ({ children, ...props })=>{
    const state = useGuidedTour('TooltipWrapper', (s)=>s.state);
    if (!state.enabled || state.hidden) {
        return children;
    }
    return /*#__PURE__*/ jsx(GuidedTourTooltipImpl, {
        ...props,
        children: children
    });
};
const GuidedTourOverlay = styled(Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(50, 50, 77, 0.2);
  z-index: 10;
`;
const GuidedTourTooltipImpl = ({ children, content, tourName, step, when })=>{
    const { data: guidedTourMeta } = useGetGuidedTourMetaQuery();
    const state = useGuidedTour('GuidedTourTooltip', (s)=>s.state);
    const dispatch = useGuidedTour('GuidedTourTooltip', (s)=>s.dispatch);
    const isCurrentStep = state.tours[tourName].currentStep === step;
    const isStepConditionMet = when ? when(state.completedActions) : true;
    const isPopoverOpen = guidedTourMeta?.data?.isFirstSuperAdminUser && !state.tours[tourName].isCompleted && isCurrentStep && isStepConditionMet;
    // Lock the scroll
    React.useEffect(()=>{
        if (!isPopoverOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return ()=>{
            document.body.style.overflow = originalStyle;
        };
    }, [
        isPopoverOpen
    ]);
    const Step = React.useMemo(()=>createStepComponents(tourName), [
        tourName
    ]);
    const hasApiSchema = Object.keys(guidedTourMeta?.data?.schemas ?? {}).filter((key)=>key.startsWith('api::')).length > 0;
    React.useEffect(()=>{
        if (hasApiSchema) {
            /**
       * Fallback sync:
       *
       * When the user already has a schema (ie started project from template with seeded data),
       * allow them to proceed to the content manager tour.
       *
       * When the CTB fails to restart after saving a schema (as it often does)
       */ dispatch({
                type: 'set_completed_actions',
                payload: [
                    GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.createSchema
                ]
            });
        }
    }, [
        dispatch,
        hasApiSchema,
        step,
        tourName
    ]);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            isPopoverOpen && /*#__PURE__*/ jsx(Portal, {
                children: /*#__PURE__*/ jsx(GuidedTourOverlay, {})
            }),
            /*#__PURE__*/ jsxs(Popover.Root, {
                open: isPopoverOpen,
                children: [
                    /*#__PURE__*/ jsx(Popover.Anchor, {
                        children: children
                    }),
                    content({
                        Step,
                        state,
                        dispatch
                    })
                ]
            })
        ]
    });
};
function createTour(tourName, steps) {
    const tour = steps.reduce((acc, step, index)=>{
        const name = step.name;
        if (name in acc) {
            throw Error(`The tour: ${tourName} with step: ${step.name} has already been registered`);
        }
        acc[name] = ({ children })=>{
            return /*#__PURE__*/ jsx(GuidedTourTooltip, {
                tourName: tourName,
                step: index,
                content: step.content,
                when: step.when,
                children: children
            });
        };
        if (step.excludeFromStepCount) {
            // Subtract all steps registered to be excluded from the step count
            acc._meta.displayedStepCount--;
        }
        return acc;
    }, {
        _meta: {
            totalStepCount: steps.length,
            displayedStepCount: steps.length
        }
    });
    return tour;
}

export { createTour, tours };
//# sourceMappingURL=Tours.mjs.map
