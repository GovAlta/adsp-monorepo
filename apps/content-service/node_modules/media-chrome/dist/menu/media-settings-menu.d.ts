import { MediaChromeMenu } from './media-chrome-menu.js';
/**
 * @extends {MediaChromeMenu}
 *
 * @cssproperty --media-settings-menu-justify-content - `justify-content` of the menu.
 */
declare class MediaSettingsMenu extends MediaChromeMenu {
    static template: HTMLTemplateElement;
    /**
     * Returns the anchor element when it is a floating menu.
     */
    get anchorElement(): HTMLElement;
}
export { MediaSettingsMenu };
export default MediaSettingsMenu;
