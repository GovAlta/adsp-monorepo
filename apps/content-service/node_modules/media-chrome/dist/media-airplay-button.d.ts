import { MediaChromeButton } from './media-chrome-button.js';
/**
 * @slot enter - An element shown when the media is not in AirPlay mode and pressing the button will open the AirPlay menu.
 * @slot exit - An element shown when the media is in AirPlay mode and pressing the button will open the AirPlay menu.
 * @slot icon - The element shown for the AirPlay button’s display.
 *
 * @attr {(unavailable|unsupported)} mediaairplayunavailable - (read-only) Set if AirPlay is unavailable.
 * @attr {boolean} mediaisairplaying - (read-only) Present if the media is airplaying.
 *
 * @cssproperty [--media-airplay-button-display = inline-flex] - `display` property of button.
 *
 * @event {CustomEvent} mediaairplayrequest
 */
declare class MediaAirplayButton extends MediaChromeButton {
    static get observedAttributes(): string[];
    constructor(options?: {
        slotTemplate?: HTMLTemplateElement;
    });
    connectedCallback(): void;
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Are we currently airplaying
     */
    get mediaIsAirplaying(): boolean;
    set mediaIsAirplaying(value: boolean);
    /**
     * Airplay unavailability state
     */
    get mediaAirplayUnavailable(): string | undefined;
    set mediaAirplayUnavailable(value: string | undefined);
    handleClick(): void;
}
export default MediaAirplayButton;
