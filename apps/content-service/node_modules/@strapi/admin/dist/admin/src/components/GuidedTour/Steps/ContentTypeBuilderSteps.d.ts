import { CompletedActions } from '../Context';
import { type StepContentProps } from '../Tours';
export declare const contentTypeBuilderSteps: readonly [{
    readonly name: "Introduction";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, ...({
    name: string;
    content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
} | {
    name: string;
    content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
})[], {
    readonly name: "Save";
    readonly when: (completedActions: CompletedActions) => boolean;
    readonly content: ({ Step, dispatch }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
}, {
    readonly name: "Finish";
    readonly content: ({ Step }: StepContentProps) => import("react/jsx-runtime").JSX.Element;
    readonly excludeFromStepCount: true;
    readonly when: (completedActions: CompletedActions) => boolean;
}];
