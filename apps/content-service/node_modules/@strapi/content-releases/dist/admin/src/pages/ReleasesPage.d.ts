import { type Release } from '../../../shared/contracts/releases';
declare const getBadgeProps: (status: Release['status']) => {
    textColor: string;
    backgroundColor: string;
    borderColor: string;
};
declare const ReleasesPage: () => import("react/jsx-runtime").JSX.Element;
export { ReleasesPage, getBadgeProps };
