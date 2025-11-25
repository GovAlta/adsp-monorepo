import { MediaChromeButton } from './media-chrome-button.js';
import { AttributeTokenList } from './utils/attribute-token-list.js';
export declare const Attributes: {
    RATES: string;
};
export declare const DEFAULT_RATES: number[];
export declare const DEFAULT_RATE = 1;
/**
 * @attr {string} rates - Set custom playback rates for the user to choose from.
 * @attr {string} mediaplaybackrate - (read-only) Set to the media playback rate.
 *
 * @cssproperty [--media-playback-rate-button-display = inline-flex] - `display` property of button.
 */
declare class MediaPlaybackRateButton extends MediaChromeButton {
    #private;
    static get observedAttributes(): string[];
    container: HTMLSlotElement;
    constructor(options?: {});
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void;
    /**
     * @type { AttributeTokenList | Array<number> | undefined} Will return a DOMTokenList.
     * Setting a value will accept an array of numbers.
     */
    get rates(): AttributeTokenList;
    set rates(value: AttributeTokenList);
    /**
     * @type {number} The current playback rate
     */
    get mediaPlaybackRate(): number;
    set mediaPlaybackRate(value: number);
    handleClick(): void;
}
export default MediaPlaybackRateButton;
