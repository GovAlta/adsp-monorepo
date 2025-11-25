interface TriggerContainerProps extends Pick<StatusProps, 'isPending'> {
    onCancel: () => void;
    response?: {
        statusCode: number;
        message?: string;
    };
}
declare const TriggerContainer: ({ isPending, onCancel, response }: TriggerContainerProps) => import("react/jsx-runtime").JSX.Element;
interface StatusProps {
    isPending: boolean;
    statusCode?: number;
}
export { TriggerContainer };
