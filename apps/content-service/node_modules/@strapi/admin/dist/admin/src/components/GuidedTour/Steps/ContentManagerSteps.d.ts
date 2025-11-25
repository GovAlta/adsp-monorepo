import { CompletedActions } from '../Context';
import { type StepContentProps } from '../Tours';
export declare const contentManagerSteps: readonly [{
    readonly name: "Introduction";
    readonly when: (completedActions: CompletedActions) => boolean;
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, ...{
    name: string;
    content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}[], {
    readonly name: "Fields";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "Publish";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "Finish";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
    readonly excludeFromStepCount: true;
    readonly when: (completedActions: CompletedActions) => boolean;
}];
