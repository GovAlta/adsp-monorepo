interface UploadProjectContextType {
    isCodeUploadOpen: boolean;
    submitOnFinish: boolean;
    openCodeUpload: (submitOnFinish?: boolean) => void;
    closeCodeUpload: () => void;
}
export declare const useUploadProjectToChat: () => UploadProjectContextType;
export declare const UploadProjectToChatProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const UploadCodeModal: () => import("react/jsx-runtime").JSX.Element;
export {};
