import { MenuItem } from '../../hooks/useMenu';
declare const MainNavIcons: ({ listLinks, mobileLinks, handleClickOnLink, }: {
    listLinks: MenuItem[];
    mobileLinks: MenuItem[];
    handleClickOnLink: (value: string) => void;
}) => (import("react/jsx-runtime").JSX.Element | null)[] | null;
declare const MainNavBurgerMenuLinks: ({ listLinks, handleClickOnLink, }: {
    listLinks: MenuItem[];
    handleClickOnLink: (value: string) => void;
}) => import("react/jsx-runtime").JSX.Element[] | null;
export { MainNavIcons, MainNavBurgerMenuLinks };
