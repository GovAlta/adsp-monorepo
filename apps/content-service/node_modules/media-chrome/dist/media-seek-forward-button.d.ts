import { MediaChromeButton } from './media-chrome-button.js';
export declare const Attributes: {
    SEEK_OFFSET: string;
};
/**
 * @slot icon - The element shown for the seek forward button’s display.
 *
 * @attr {string} seekoffset - Adjusts how much time (in seconds) the playhead should seek forward.
 * @attr {string} mediacurrenttime - (read-only) Set to the current media time.
 *
 * @cssproperty [--media-seek-forward-button-display = inline-flex] - `display` property of button.
 */
declare class MediaSeekForwardButton extends MediaChromeButton {
    static get observedAttributes(): string[];
    constructor(options?: {});
    connectedCallback(): void;
    attributeChangedCallback(attrName: string, _oldValue: string | null, newValue: string | null): void;
    /**
     * Seek amount in seconds
     */
    get seekOffset(): number;
    set seekOffset(value: number);
    /**
     * The current time in seconds
     */
    get mediaCurrentTime(): number;
    set mediaCurrentTime(time: number);
    handleClick(): void;
}
export default MediaSeekForwardButton;
