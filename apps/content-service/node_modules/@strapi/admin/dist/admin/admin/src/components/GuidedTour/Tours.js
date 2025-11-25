'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var styled = require('styled-components');
var admin = require('../../services/admin.js');
var Context = require('./Context.js');
var ApiTokensSteps = require('./Steps/ApiTokensSteps.js');
var ContentManagerSteps = require('./Steps/ContentManagerSteps.js');
var ContentTypeBuilderSteps = require('./Steps/ContentTypeBuilderSteps.js');
var Step = require('./Steps/Step.js');
var constants = require('./utils/constants.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

/* -------------------------------------------------------------------------------------------------
 * Tours
 * -----------------------------------------------------------------------------------------------*/ const tours = {
    contentTypeBuilder: createTour('contentTypeBuilder', ContentTypeBuilderSteps.contentTypeBuilderSteps),
    contentManager: createTour('contentManager', ContentManagerSteps.contentManagerSteps),
    apiTokens: createTour('apiTokens', ApiTokensSteps.apiTokensSteps),
    strapiCloud: createTour('strapiCloud', [])
};
const GuidedTourTooltip = ({ children, ...props })=>{
    const state = Context.useGuidedTour('TooltipWrapper', (s)=>s.state);
    if (!state.enabled || state.hidden) {
        return children;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(GuidedTourTooltipImpl, {
        ...props,
        children: children
    });
};
const GuidedTourOverlay = styled.styled(designSystem.Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(50, 50, 77, 0.2);
  z-index: 10;
`;
const GuidedTourTooltipImpl = ({ children, content, tourName, step, when })=>{
    const { data: guidedTourMeta } = admin.useGetGuidedTourMetaQuery();
    const state = Context.useGuidedTour('GuidedTourTooltip', (s)=>s.state);
    const dispatch = Context.useGuidedTour('GuidedTourTooltip', (s)=>s.dispatch);
    const isCurrentStep = state.tours[tourName].currentStep === step;
    const isStepConditionMet = when ? when(state.completedActions) : true;
    const isPopoverOpen = guidedTourMeta?.data?.isFirstSuperAdminUser && !state.tours[tourName].isCompleted && isCurrentStep && isStepConditionMet;
    // Lock the scroll
    React__namespace.useEffect(()=>{
        if (!isPopoverOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return ()=>{
            document.body.style.overflow = originalStyle;
        };
    }, [
        isPopoverOpen
    ]);
    const Step$1 = React__namespace.useMemo(()=>Step.createStepComponents(tourName), [
        tourName
    ]);
    const hasApiSchema = Object.keys(guidedTourMeta?.data?.schemas ?? {}).filter((key)=>key.startsWith('api::')).length > 0;
    React__namespace.useEffect(()=>{
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
                    constants.GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.createSchema
                ]
            });
        }
    }, [
        dispatch,
        hasApiSchema,
        step,
        tourName
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            isPopoverOpen && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Portal, {
                children: /*#__PURE__*/ jsxRuntime.jsx(GuidedTourOverlay, {})
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
                open: isPopoverOpen,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Anchor, {
                        children: children
                    }),
                    content({
                        Step: Step$1,
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
            return /*#__PURE__*/ jsxRuntime.jsx(GuidedTourTooltip, {
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

exports.createTour = createTour;
exports.tours = tours;
//# sourceMappingURL=Tours.js.map
