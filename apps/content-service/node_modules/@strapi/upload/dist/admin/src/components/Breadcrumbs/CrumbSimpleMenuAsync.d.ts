interface CrumbSimpleMenuAsyncProps {
    parentsToOmit?: number[];
    currentFolderId?: number;
    onChangeFolder?: (id: number, path?: string) => void;
}
export declare const CrumbSimpleMenuAsync: ({ parentsToOmit, currentFolderId, onChangeFolder, }: CrumbSimpleMenuAsyncProps) => import("react/jsx-runtime").JSX.Element;
export {};
