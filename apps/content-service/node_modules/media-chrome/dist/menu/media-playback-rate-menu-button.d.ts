import { MediaChromeMenuButton } from './media-chrome-menu-button.js';
import { AttributeTokenList } from '../utils/attribute-token-list.js';
export declare const Attributes: {
    RATES: string;
};
export declare const DEFAULT_RATES: number[];
export declare const DEFAULT_RATE = 1;
/**
 * @attr {string} rates - Set custom playback rates for the user to choose from.
 * @attr {string} mediaplaybackrate - (read-only) Set to the media playback rate.
 *
 * @cssproperty [--media-playback-rate-menu-button-display = inline-flex] - `display` property of button.
 */
declare class MediaPlaybackRateMenuButton extends MediaChromeMenuButton {
    #private;
    static get observedAttributes(): string[];
    container: HTMLSlotElement;
    constructor(options?: {});
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Returns the element with the id specified by the `invoketarget` attribute.
     */
    get invokeTargetElement(): HTMLElement | null;
    /**
     * Will return a DOMTokenList.
     * Setting a value will accept an array of numbers.
     */
    get rates(): AttributeTokenList | number[] | undefined;
    set rates(value: AttributeTokenList | number[] | undefined);
    /**
     * The current playback rate
     */
    get mediaPlaybackRate(): number;
    set mediaPlaybackRate(value: number);
}
export { MediaPlaybackRateMenuButton };
export default MediaPlaybackRateMenuButton;
