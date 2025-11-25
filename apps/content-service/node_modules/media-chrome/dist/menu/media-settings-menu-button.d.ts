import { MediaChromeMenuButton } from './media-chrome-menu-button.js';
/**
 * @attr {string} target - CSS id selector for the element to be targeted by the button.
 */
declare class MediaSettingsMenuButton extends MediaChromeMenuButton {
    static get observedAttributes(): string[];
    constructor();
    connectedCallback(): void;
    /**
     * Returns the element with the id specified by the `invoketarget` attribute.
     * @return {HTMLElement | null}
     */
    get invokeTargetElement(): HTMLElement | null;
}
export { MediaSettingsMenuButton };
export default MediaSettingsMenuButton;
