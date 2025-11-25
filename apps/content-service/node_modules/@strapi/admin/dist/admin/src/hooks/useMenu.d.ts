import { StrapiAppContextValue } from '../features/StrapiApp';
export type MenuItem = Omit<StrapiAppContextValue['menu'][number], 'Component'> & {
    navigationLink?: string;
};
export type MobileMenuItem = {
    to: string;
    link?: string;
};
export interface Menu {
    generalSectionLinks: MenuItem[];
    pluginsSectionLinks: MenuItem[];
    topMobileNavigation: MobileMenuItem[];
    burgerMobileNavigation: MobileMenuItem[];
    isLoading: boolean;
}
declare const useMenu: (shouldUpdateStrapi: boolean) => Menu;
export { useMenu };
