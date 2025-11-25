import MediaTooltip, { TooltipPlacement } from './media-tooltip.js';
import { globalThis } from './utils/server-safe-globals.js';
/**
 * @extends {HTMLElement}
 *
 * @attr {boolean} disabled - The Boolean disabled attribute makes the element not mutable or focusable.
 * @attr {string} mediacontroller - The element `id` of the media controller to connect to (if not nested within).
 * @attr {('top'|'right'|'bottom'|'left'|'none')} tooltipplacement - The placement of the tooltip, defaults to "top"
 * @attr {boolean} notooltip - Hides the tooltip if this attribute is present
 *
 * @cssproperty --media-primary-color - Default color of text and icon.
 * @cssproperty --media-secondary-color - Default color of button background.
 * @cssproperty --media-text-color - `color` of button text.
 * @cssproperty --media-icon-color - `fill` color of button icon.
 *
 * @cssproperty --media-control-display - `display` property of control.
 * @cssproperty --media-control-background - `background` of control.
 * @cssproperty --media-control-hover-background - `background` of control hover state.
 * @cssproperty --media-control-padding - `padding` of control.
 * @cssproperty --media-control-height - `line-height` of control.
 *
 * @cssproperty --media-font - `font` shorthand property.
 * @cssproperty --media-font-weight - `font-weight` property.
 * @cssproperty --media-font-family - `font-family` property.
 * @cssproperty --media-font-size - `font-size` property.
 * @cssproperty --media-text-content-height - `line-height` of button text.
 *
 * @cssproperty --media-button-icon-width - `width` of button icon.
 * @cssproperty --media-button-icon-height - `height` of button icon.
 * @cssproperty --media-button-icon-transform - `transform` of button icon.
 * @cssproperty --media-button-icon-transition - `transition` of button icon.
 */
declare class MediaChromeButton extends globalThis.HTMLElement {
    #private;
    preventClick: boolean;
    nativeEl: DocumentFragment;
    tooltipEl: MediaTooltip;
    tooltipContent: string;
    static get observedAttributes(): string[];
    constructor(options?: Partial<{
        slotTemplate: HTMLTemplateElement;
        defaultContent: string;
        tooltipContent: string;
    }>);
    enable(): void;
    disable(): void;
    attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    get keysUsed(): string[];
    /**
     * Get or set tooltip placement
     */
    get tooltipPlacement(): TooltipPlacement | undefined;
    set tooltipPlacement(value: TooltipPlacement | undefined);
    /**
     * @abstract
     * @argument {Event} e
     */
    handleClick(e: any): void;
}
export { MediaChromeButton };
export default MediaChromeButton;
