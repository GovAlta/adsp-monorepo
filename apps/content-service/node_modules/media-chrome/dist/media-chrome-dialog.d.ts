import { globalThis } from './utils/server-safe-globals.js';
export declare const Attributes: {
    HIDDEN: string;
    ANCHOR: string;
};
/**
 * @extends {HTMLElement}
 *
 * @slot - Default slotted elements.
 *
 * @cssproperty --media-primary-color - Default color of text / icon.
 * @cssproperty --media-secondary-color - Default color of background.
 * @cssproperty --media-text-color - `color` of text.
 *
 * @cssproperty --media-control-background - `background` of control.
 * @cssproperty --media-dialog-display - `display` of dialog.
 * @cssproperty --media-dialog-background - `background` of dialog.
 * @cssproperty --media-dialog-border-radius - `border-radius` of dialog.
 * @cssproperty --media-dialog-border - `border` of dialog.
 * @cssproperty --media-dialog-transition-in - `transition` of dialog when showing.
 * @cssproperty --media-dialog-transition-out - `transition` of dialog when hiding.
 * @cssproperty --media-dialog-visibility - `visibility` of dialog when showing.
 * @cssproperty --media-dialog-hidden-visibility - `visibility` of dialog when hiding.
 * @cssproperty --media-dialog-opacity - `opacity` of dialog when showing.
 * @cssproperty --media-dialog-hidden-opacity - `opacity` of dialog when hiding.
 * @cssproperty --media-dialog-transform-in - `transform` of dialog when showing.
 * @cssproperty --media-dialog-transform-out - `transform` of dialog when hiding.
 *
 * @cssproperty --media-font - `font` shorthand property.
 * @cssproperty --media-font-weight - `font-weight` property.
 * @cssproperty --media-font-family - `font-family` property.
 * @cssproperty --media-font-size - `font-size` property.
 * @cssproperty --media-text-content-height - `line-height` of text.
 */
declare class MediaChromeDialog extends globalThis.HTMLElement {
    #private;
    static template: HTMLTemplateElement;
    static get observedAttributes(): string[];
    nativeEl: HTMLElement;
    constructor();
    handleEvent(event: Event): void;
    connectedCallback(): void;
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string | null): void;
    focus(): void;
    get keysUsed(): string[];
}
export { MediaChromeDialog };
export default MediaChromeDialog;
