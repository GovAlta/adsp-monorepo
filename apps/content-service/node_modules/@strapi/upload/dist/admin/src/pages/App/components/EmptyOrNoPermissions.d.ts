interface EmptyOrNoPermissionsProps {
    canCreate: boolean;
    canRead: boolean;
    isFiltering: boolean;
    onActionClick: () => void;
}
export declare const EmptyOrNoPermissions: ({ canCreate, isFiltering, canRead, onActionClick, }: EmptyOrNoPermissionsProps) => import("react/jsx-runtime").JSX.Element;
export {};
