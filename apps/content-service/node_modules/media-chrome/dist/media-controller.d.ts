import { MediaContainer } from './media-container.js';
import { AttributeTokenList } from './utils/attribute-token-list.js';
import { MediaStore } from './media-store/media-store.js';
export declare const Attributes: {
    DEFAULT_SUBTITLES: string;
    DEFAULT_STREAM_TYPE: string;
    DEFAULT_DURATION: string;
    FULLSCREEN_ELEMENT: string;
    HOTKEYS: string;
    KEYS_USED: string;
    LIVE_EDGE_OFFSET: string;
    NO_AUTO_SEEK_TO_LIVE: string;
    NO_HOTKEYS: string;
    NO_VOLUME_PREF: string;
    NO_SUBTITLES_LANG_PREF: string;
    NO_DEFAULT_STORE: string;
    KEYBOARD_FORWARD_SEEK_OFFSET: string;
    KEYBOARD_BACKWARD_SEEK_OFFSET: string;
};
/**
 * Media Controller should not mimic the HTMLMediaElement API.
 * @see https://github.com/muxinc/media-chrome/pull/182#issuecomment-1067370339
 *
 * @attr {boolean} defaultsubtitles
 * @attr {string} defaultstreamtype
 * @attr {string} defaultduration
 * @attr {string} fullscreenelement
 * @attr {boolean} nohotkeys
 * @attr {string} hotkeys
 * @attr {string} keysused
 * @attr {string} liveedgeoffset
 * @attr {boolean} noautoseektolive
 * @attr {boolean} novolumepref
 * @attr {boolean} nosubtitleslangpref
 * @attr {boolean} nodefaultstore
 */
declare class MediaController extends MediaContainer {
    #private;
    static get observedAttributes(): string[];
    mediaStateReceivers: HTMLElement[];
    associatedElementSubscriptions: Map<HTMLElement, () => void>;
    constructor();
    get mediaStore(): MediaStore;
    set mediaStore(value: MediaStore);
    get fullscreenElement(): HTMLElement;
    set fullscreenElement(element: HTMLElement);
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * @override
     * @param {HTMLMediaElement} media
     */
    mediaSetCallback(media: HTMLMediaElement): void;
    /**
     * @override
     * @param {HTMLMediaElement} media
     */
    mediaUnsetCallback(media: HTMLMediaElement): void;
    propagateMediaState(stateName: string, state: any): void;
    associateElement(element: HTMLElement): void;
    unassociateElement(element: HTMLElement): void;
    registerMediaStateReceiver(el: HTMLElement): void;
    unregisterMediaStateReceiver(el: HTMLElement): void;
    enableHotkeys(): void;
    disableHotkeys(): void;
    get hotkeys(): AttributeTokenList;
    keyboardShortcutHandler(e: KeyboardEvent): void;
}
export { MediaController };
export default MediaController;
