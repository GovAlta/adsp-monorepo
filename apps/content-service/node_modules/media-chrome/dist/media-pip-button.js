import { MediaChromeButton } from "./media-chrome-button.js";
import { globalThis, document } from "./utils/server-safe-globals.js";
import { MediaUIEvents, MediaUIAttributes } from "./constants.js";
import { tooltipLabels, verbs } from "./labels/labels.js";
import {
  getBooleanAttr,
  getStringAttr,
  setBooleanAttr,
  setStringAttr
} from "./utils/element-utils.js";
const pipIcon = `<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`;
const slotTemplate = document.createElement("template");
slotTemplate.innerHTML = /*html*/
`
  <style>
  :host([${MediaUIAttributes.MEDIA_IS_PIP}]) slot[name=icon] slot:not([name=exit]) {
    display: none !important;
  }

  ${/* Double negative, but safer if display doesn't equal 'block' */
""}
  :host(:not([${MediaUIAttributes.MEDIA_IS_PIP}])) slot[name=icon] slot:not([name=enter]) {
    display: none !important;
  }

  :host([${MediaUIAttributes.MEDIA_IS_PIP}]) slot[name=tooltip-enter],
  :host(:not([${MediaUIAttributes.MEDIA_IS_PIP}])) slot[name=tooltip-exit] {
    display: none;
  }
  </style>

  <slot name="icon">
    <slot name="enter">${pipIcon}</slot>
    <slot name="exit">${pipIcon}</slot>
  </slot>
`;
const tooltipContent = (
  /*html*/
  `
  <slot name="tooltip-enter">${tooltipLabels.ENTER_PIP}</slot>
  <slot name="tooltip-exit">${tooltipLabels.EXIT_PIP}</slot>
`
);
const updateAriaLabel = (el) => {
  const label = el.mediaIsPip ? verbs.EXIT_PIP() : verbs.ENTER_PIP();
  el.setAttribute("aria-label", label);
};
class MediaPipButton extends MediaChromeButton {
  static get observedAttributes() {
    return [
      ...super.observedAttributes,
      MediaUIAttributes.MEDIA_IS_PIP,
      MediaUIAttributes.MEDIA_PIP_UNAVAILABLE
    ];
  }
  constructor(options = {}) {
    super({ slotTemplate, tooltipContent, ...options });
  }
  connectedCallback() {
    updateAriaLabel(this);
    super.connectedCallback();
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === MediaUIAttributes.MEDIA_IS_PIP) {
      updateAriaLabel(this);
    }
    super.attributeChangedCallback(attrName, oldValue, newValue);
  }
  /**
   * @type {string | undefined} Pip unavailability state
   */
  get mediaPipUnavailable() {
    return getStringAttr(this, MediaUIAttributes.MEDIA_PIP_UNAVAILABLE);
  }
  set mediaPipUnavailable(value) {
    setStringAttr(this, MediaUIAttributes.MEDIA_PIP_UNAVAILABLE, value);
  }
  /**
   * @type {boolean} Is the media currently playing picture-in-picture
   */
  get mediaIsPip() {
    return getBooleanAttr(this, MediaUIAttributes.MEDIA_IS_PIP);
  }
  set mediaIsPip(value) {
    setBooleanAttr(this, MediaUIAttributes.MEDIA_IS_PIP, value);
  }
  handleClick() {
    const eventName = this.mediaIsPip ? MediaUIEvents.MEDIA_EXIT_PIP_REQUEST : MediaUIEvents.MEDIA_ENTER_PIP_REQUEST;
    this.dispatchEvent(
      new globalThis.CustomEvent(eventName, { composed: true, bubbles: true })
    );
  }
}
if (!globalThis.customElements.get("media-pip-button")) {
  globalThis.customElements.define("media-pip-button", MediaPipButton);
}
var media_pip_button_default = MediaPipButton;
export {
  media_pip_button_default as default
};
