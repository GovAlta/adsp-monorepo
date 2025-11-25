import { globalThis } from '../polyfills';
declare class MediaDialog extends globalThis.HTMLElement {
    static styles: string;
    static template: HTMLTemplateElement;
    static observedAttributes: string[];
    _previouslyFocusedElement?: Element | null;
    constructor();
    show(): void;
    close(): void;
    attributeChangedCallback(attrName: string, oldValue: string | null, newValue: string): void;
    connectedCallback(): void;
}
export default MediaDialog;
