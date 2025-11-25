export interface FormValues {
    name: string;
    date?: string;
    time: string;
    timezone: string | null;
    isScheduled?: boolean;
    scheduledAt: Date | null;
}
interface ReleaseModalProps {
    handleClose: () => void;
    handleSubmit: (values: FormValues) => void;
    isLoading?: boolean;
    initialValues: FormValues;
    open?: boolean;
}
export declare const ReleaseModal: ({ handleClose, open, handleSubmit, initialValues, isLoading, }: ReleaseModalProps) => import("react/jsx-runtime").JSX.Element;
export {};
