import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { produce } from 'immer';
import { useTracking } from '../../features/Tracking.mjs';
import { useIsDesktop } from '../../hooks/useMediaQuery.mjs';
import { usePersistentState } from '../../hooks/usePersistentState.mjs';
import { createContext } from '../Context.mjs';
import { tours } from './Tours.mjs';
import { migrateTours } from './utils/migrations.mjs';

const [GuidedTourProviderImpl, useGuidedTour] = createContext('GuidedTour');
const getInitialTourState = (tours)=>{
    return Object.keys(tours).reduce((acc, tourName)=>{
        acc[tourName] = {
            currentStep: 0,
            isCompleted: false,
            tourType: undefined
        };
        return acc;
    }, {});
};
const getCompletedTours = (tours)=>{
    return Object.keys(tours).filter((tourName)=>tours[tourName].isCompleted);
};
const areAllToursCompleted = (tours)=>Object.values(tours).every((t)=>t.isCompleted);
function reducer(state, action) {
    return produce(state, (draft)=>{
        if (action.type === 'next_step') {
            const currentStep = draft.tours[action.payload].currentStep;
            const tourLength = tours[action.payload]._meta.totalStepCount;
            const nextStep = currentStep + 1;
            draft.tours[action.payload].currentStep = nextStep;
            draft.tours[action.payload].isCompleted = nextStep >= tourLength;
        }
        if (action.type === 'previous_step') {
            const currentStep = draft.tours[action.payload].currentStep;
            if (currentStep <= 0) return;
            const previousStep = currentStep - 1;
            draft.tours[action.payload].currentStep = previousStep;
        }
        if (action.type === 'skip_tour') {
            draft.tours[action.payload].isCompleted = true;
        }
        if (action.type === 'set_completed_actions') {
            draft.completedActions = [
                ...new Set([
                    ...draft.completedActions,
                    ...action.payload
                ])
            ];
        }
        if (action.type === 'remove_completed_action') {
            draft.completedActions = draft.completedActions.filter((completedAction)=>completedAction !== action.payload);
        }
        if (action.type === 'skip_all_tours') {
            draft.enabled = false;
        }
        if (action.type === 'set_hidden') {
            draft.hidden = action.payload;
        }
        if (action.type === 'reset_all_tours') {
            draft.enabled = true;
            draft.tours = getInitialTourState(tours);
            draft.completedActions = [];
        }
        if (action.type === 'go_to_step') {
            draft.tours[action.payload.tourName].currentStep = action.payload.step;
        }
        if (action.type === 'set_tour_type') {
            const { tourName, tourType } = action.payload;
            const currentTour = draft.tours[tourName];
            // If tour type changes and tour is not completed, reset to step 0
            if (currentTour.tourType && currentTour.tourType !== tourType && !currentTour.isCompleted) {
                currentTour.currentStep = 0;
            }
            currentTour.tourType = tourType;
        }
    });
}
const STORAGE_KEY = 'STRAPI_GUIDED_TOUR';
const GuidedTourContext = ({ children, enabled = true })=>{
    const isDesktop = useIsDesktop();
    const { trackUsage } = useTracking();
    const [storedTours, setStoredTours] = usePersistentState(STORAGE_KEY, {
        tours: getInitialTourState(tours),
        enabled,
        hidden: !isDesktop,
        completedActions: []
    });
    const migratedTourState = migrateTours(storedTours);
    const [state, dispatch] = React.useReducer(reducer, migratedTourState);
    // Watch for changes to enabled prop to update state
    React.useEffect(()=>{
        dispatch({
            type: 'set_hidden',
            payload: !isDesktop
        });
    }, [
        isDesktop
    ]);
    // Sync local storage
    React.useEffect(()=>{
        setStoredTours(state);
    }, [
        state,
        setStoredTours
    ]);
    // Derive all completed tours from state
    const currentAllCompletedState = areAllToursCompleted(state.tours);
    // Store completed state in ref to survive a re-render,
    // when current state changes this will persist and be used for comparison
    const previousAllCompletedStateRef = React.useRef(currentAllCompletedState);
    React.useEffect(()=>{
        const previousAllCompletedState = previousAllCompletedStateRef.current;
        // When the previous state was not complete but the current state is now complete, fire the event
        if (!previousAllCompletedState && currentAllCompletedState) {
            trackUsage('didCompleteGuidedTour', {
                name: 'all'
            });
        }
        // When the current state has all tours completed so will the previous state, the tracking event won't fire again
        previousAllCompletedStateRef.current = currentAllCompletedState;
    }, [
        currentAllCompletedState,
        trackUsage
    ]);
    return /*#__PURE__*/ jsx(GuidedTourProviderImpl, {
        state: state,
        dispatch: dispatch,
        children: children
    });
};

export { GuidedTourContext, getCompletedTours, reducer, useGuidedTour };
//# sourceMappingURL=Context.mjs.map
