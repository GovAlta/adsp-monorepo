interface UploadFigmaContextType {
    isFigmaUploadOpen: boolean;
    submitOnFinish: boolean;
    openFigmaUpload: (submitOnFinish?: boolean) => void;
    closeFigmaUpload: () => void;
}
export declare const useUploadFigmaToChat: () => UploadFigmaContextType;
export declare const UploadFigmaToChatProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const UploadFigmaModal: () => import("react/jsx-runtime").JSX.Element;
export {};
