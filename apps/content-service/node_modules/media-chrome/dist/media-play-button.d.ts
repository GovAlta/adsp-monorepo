import { MediaChromeButton } from './media-chrome-button.js';
/**
 * @slot play - An element shown when the media is paused and pressing the button will start media playback.
 * @slot pause - An element shown when the media is playing and pressing the button will pause media playback.
 * @slot icon - An element for representing play and pause states in a single icon
 *
 * @attr {boolean} mediapaused - (read-only) Present if the media is paused.
 *
 * @cssproperty [--media-play-button-display = inline-flex] - `display` property of button.
 */
declare class MediaPlayButton extends MediaChromeButton {
    static get observedAttributes(): string[];
    constructor(options?: {});
    connectedCallback(): void;
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Is the media paused
     */
    get mediaPaused(): boolean;
    set mediaPaused(value: boolean);
    handleClick(): void;
}
export { MediaPlayButton };
export default MediaPlayButton;
