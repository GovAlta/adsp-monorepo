import * as React from 'react';
import { type State, type Action, CompletedActions } from './Context';
import { type Step } from './Steps/Step';
declare const tours: {
    readonly contentTypeBuilder: {
        [x: string]: React.ComponentType<{
            children: React.ReactNode;
        }>;
    } & {
        _meta: {
            totalStepCount: number;
            displayedStepCount: number;
        };
    };
    readonly contentManager: {
        [x: string]: React.ComponentType<{
            children: React.ReactNode;
        }>;
    } & {
        _meta: {
            totalStepCount: number;
            displayedStepCount: number;
        };
    };
    readonly apiTokens: {
        Introduction: React.ComponentType<{
            children: React.ReactNode;
        }>;
        Finish: React.ComponentType<{
            children: React.ReactNode;
        }>;
        ManageAPIToken: React.ComponentType<{
            children: React.ReactNode;
        }>;
        ViewAPIToken: React.ComponentType<{
            children: React.ReactNode;
        }>;
        CopyAPIToken: React.ComponentType<{
            children: React.ReactNode;
        }>;
    } & {
        _meta: {
            totalStepCount: number;
            displayedStepCount: number;
        };
    };
    readonly strapiCloud: {} & {
        _meta: {
            totalStepCount: number;
            displayedStepCount: number;
        };
    };
};
type Tours = typeof tours;
export type StepContentProps = {
    Step: Step;
    state: State;
    dispatch: React.Dispatch<Action>;
};
type Content = (props: StepContentProps) => React.ReactNode;
export type TourStep<P extends string> = {
    name: P;
    content: Content;
    when?: (completedActions: CompletedActions) => boolean;
    excludeFromStepCount?: boolean;
};
export declare function createTour<const T extends ReadonlyArray<TourStep<string>>>(tourName: string, steps: T): { [K in T[number]["name"]]: React.ComponentType<{
    children: React.ReactNode;
}>; } & {
    _meta: {
        totalStepCount: number;
        displayedStepCount: number;
    };
};
export type { Content, Tours };
export { tours };
