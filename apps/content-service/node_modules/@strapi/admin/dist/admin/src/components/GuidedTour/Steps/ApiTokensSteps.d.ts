import { type CompletedActions } from '../Context';
import { type StepContentProps } from '../Tours';
export declare const apiTokensSteps: readonly [{
    readonly name: "Introduction";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "ManageAPIToken";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "ViewAPIToken";
    readonly content: ({ Step, dispatch }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "CopyAPIToken";
    readonly content: ({ Step, dispatch }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "Finish";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
    readonly excludeFromStepCount: true;
    readonly when: (completedActions: CompletedActions) => boolean;
}];
