import { SettingsMenuLink } from '../constants';
import type { StrapiAppSetting, StrapiAppSettingLink as IStrapiAppSettingLink } from '../core/apis/router';
interface SettingsMenuLinkWithPermissions extends SettingsMenuLink {
    permissions: IStrapiAppSettingLink['permissions'];
    hasNotification?: boolean;
}
interface StrapiAppSettingsLink extends IStrapiAppSettingLink {
    licenseOnly?: never;
    hasNotification?: never;
}
interface SettingsMenuSection extends Omit<StrapiAppSetting, 'links'> {
    links: Array<SettingsMenuLinkWithPermissions | StrapiAppSettingsLink>;
}
interface SettingsMenuLinkWithPermissionsAndDisplayed extends SettingsMenuLinkWithPermissions {
    isDisplayed: boolean;
}
interface StrapiAppSettingLinkWithDisplayed extends StrapiAppSettingsLink {
    isDisplayed: boolean;
}
interface SettingsMenuSectionWithDisplayedLinks extends Omit<SettingsMenuSection, 'links'> {
    links: Array<SettingsMenuLinkWithPermissionsAndDisplayed | StrapiAppSettingLinkWithDisplayed>;
}
type SettingsMenu = SettingsMenuSectionWithDisplayedLinks[];
declare const useSettingsMenu: () => {
    isLoading: boolean;
    menu: SettingsMenu;
};
export { useSettingsMenu };
export type { SettingsMenu };
