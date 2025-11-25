import * as React from 'react';
import { type Tours } from './Tours';
import { GUIDED_TOUR_REQUIRED_ACTIONS } from './utils/constants';
type ValidTourName = keyof Tours;
/**
 * Derive the union of all string literal values from GUIDED_TOUR_REQUIRED_ACTIONS
 * (ie didCreateContentTypeSchema | didCreateContent etc...)
 */
type ValueOf<T> = T[keyof T];
type NonEmptyValueOf<T> = T extends Record<string, never> ? never : ValueOf<T>;
export type CompletedActions = NonEmptyValueOf<ValueOf<typeof GUIDED_TOUR_REQUIRED_ACTIONS>>[];
type Action = {
    type: 'next_step';
    payload: ValidTourName;
} | {
    type: 'previous_step';
    payload: ValidTourName;
} | {
    type: 'go_to_step';
    payload: {
        tourName: ValidTourName;
        step: number;
    };
} | {
    type: 'skip_tour';
    payload: ValidTourName;
} | {
    type: 'skip_all_tours';
} | {
    type: 'reset_all_tours';
} | {
    type: 'set_completed_actions';
    payload: CompletedActions;
} | {
    type: 'remove_completed_action';
    payload: ValueOf<CompletedActions>;
} | {
    type: 'set_tour_type';
    payload: {
        tourName: ValidTourName;
        tourType: 'ContentTypeBuilderAI' | 'ContentTypeBuilderNoAI';
    };
} | {
    type: 'set_hidden';
    payload: boolean;
};
type TourState = Record<ValidTourName, {
    currentStep: number;
    isCompleted: boolean;
    tourType?: string;
}>;
type State = {
    tours: TourState;
    enabled: boolean;
    hidden?: boolean;
    completedActions: CompletedActions;
};
declare const useGuidedTour: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: {
    state: State;
    dispatch: React.Dispatch<Action>;
}) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
declare const getCompletedTours: (tours: TourState) => ValidTourName[];
declare function reducer(state: State, action: Action): State;
declare const GuidedTourContext: ({ children, enabled, }: {
    children: React.ReactNode;
    enabled?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export type { Action, State, ValidTourName };
export { GuidedTourContext, useGuidedTour, reducer, getCompletedTours };
