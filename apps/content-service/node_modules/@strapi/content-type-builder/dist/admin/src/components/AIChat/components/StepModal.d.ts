import { ReactNode } from 'react';
interface StepModalContextType {
    currentStep: number;
    goToStep: (step: number) => void;
    nextStep: () => Promise<boolean>;
    prevStep: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    totalSteps: number;
    isLoading: boolean;
    error: Error | null;
    setError: (error: Error | null) => void;
}
export declare const useStepModal: () => StepModalContextType;
interface StepModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    children: ReactNode;
    onComplete?: () => void;
    onCancel?: () => void;
}
interface StepProps {
    title?: string;
    children: ReactNode;
    nextLabel?: string;
    cancelLabel?: string;
    backLabel?: string;
    disableNext?: boolean;
    onNext?: () => Promise<boolean> | boolean;
}
declare const StepModal: {
    ({ open, onOpenChange, title, children, onComplete, onCancel, }: StepModalProps): import("react/jsx-runtime").JSX.Element;
    Step: ({ children }: StepProps) => import("react/jsx-runtime").JSX.Element;
};
declare const Step: ({ children }: StepProps) => import("react/jsx-runtime").JSX.Element;
export { StepModal, Step };
