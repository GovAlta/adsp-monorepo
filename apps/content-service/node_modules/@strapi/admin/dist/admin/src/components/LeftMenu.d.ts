import { Menu } from '../hooks/useMenu';
interface LeftMenuProps extends Pick<Menu, 'generalSectionLinks' | 'pluginsSectionLinks' | 'topMobileNavigation' | 'burgerMobileNavigation'> {
}
declare const LeftMenu: ({ generalSectionLinks, pluginsSectionLinks, topMobileNavigation, burgerMobileNavigation, }: LeftMenuProps) => import("react/jsx-runtime").JSX.Element;
export { LeftMenu };
