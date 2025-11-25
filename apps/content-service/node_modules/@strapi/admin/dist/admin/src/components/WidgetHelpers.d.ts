interface LoadingProps {
    children?: string;
}
interface ErrorProps {
    children?: string;
}
interface NoDataProps {
    children?: string;
}
interface NoPermissionsProps {
    children?: string;
}
declare const Widget: {
    Loading: ({ children }: LoadingProps) => import("react/jsx-runtime").JSX.Element;
    Error: ({ children }: ErrorProps) => import("react/jsx-runtime").JSX.Element;
    NoData: ({ children }: NoDataProps) => import("react/jsx-runtime").JSX.Element;
    NoPermissions: ({ children }: NoPermissionsProps) => import("react/jsx-runtime").JSX.Element;
};
export { Widget };
