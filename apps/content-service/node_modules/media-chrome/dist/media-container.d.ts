import { globalThis } from './utils/server-safe-globals.js';
import './media-gesture-receiver.js';
export declare const Attributes: {
    AUDIO: string;
    AUTOHIDE: string;
    BREAKPOINTS: string;
    GESTURES_DISABLED: string;
    KEYBOARD_CONTROL: string;
    NO_AUTOHIDE: string;
    USER_INACTIVE: string;
};
/**
 * @extends {HTMLElement}
 *
 * @attr {boolean} audio
 * @attr {string} autohide
 * @attr {string} breakpoints
 * @attr {boolean} gesturesdisabled
 * @attr {boolean} keyboardcontrol
 * @attr {boolean} noautohide
 * @attr {boolean} userinactive
 *
 * @cssprop --media-background-color - `background-color` of container.
 * @cssprop --media-slot-display - `display` of the media slot (default none for [audio] usage).
 */
declare class MediaContainer extends globalThis.HTMLElement {
    #private;
    static get observedAttributes(): string[];
    breakpointsComputed: boolean;
    constructor();
    attributeChangedCallback(attrName: string, oldValue: string, newValue: string): void;
    /**
     * @returns {HTMLVideoElement &
     * {buffered,
     * webkitEnterFullscreen?,
     * webkitExitFullscreen?,
     * requestCast?,
     * webkitShowPlaybackTargetPicker?,
     * videoTracks?,
     * }}
     */
    get media(): HTMLVideoElement | null;
    /**
     * @param {HTMLMediaElement} media
     */
    handleMediaUpdated(media: HTMLMediaElement): Promise<void>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * @abstract
     * @param {HTMLMediaElement} media
     */
    mediaSetCallback(media: HTMLMediaElement): void;
    /**
     * @param {HTMLMediaElement} media
     */
    mediaUnsetCallback(media: HTMLMediaElement): void;
    handleEvent(event: Event): void;
    set autohide(seconds: string);
    get autohide(): string;
}
export { MediaContainer };
export default MediaContainer;
