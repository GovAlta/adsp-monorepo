import { MediaChromeButton } from "./media-chrome-button.js";
import { globalThis, document } from "./utils/server-safe-globals.js";
import { MediaUIEvents, MediaUIAttributes } from "./constants.js";
import { tooltipLabels, verbs } from "./labels/labels.js";
import { getBooleanAttr, setBooleanAttr } from "./utils/element-utils.js";
const playIcon = `<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`;
const pauseIcon = `<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`;
const slotTemplate = document.createElement("template");
slotTemplate.innerHTML = /*html*/
`
  <style>
    :host([${MediaUIAttributes.MEDIA_PAUSED}]) slot[name=pause],
    :host(:not([${MediaUIAttributes.MEDIA_PAUSED}])) slot[name=play] {
      display: none !important;
    }

    :host([${MediaUIAttributes.MEDIA_PAUSED}]) slot[name=tooltip-pause],
    :host(:not([${MediaUIAttributes.MEDIA_PAUSED}])) slot[name=tooltip-play] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="play">${playIcon}</slot>
    <slot name="pause">${pauseIcon}</slot>
  </slot>
`;
const tooltipContent = (
  /*html*/
  `
  <slot name="tooltip-play">${tooltipLabels.PLAY}</slot>
  <slot name="tooltip-pause">${tooltipLabels.PAUSE}</slot>
`
);
const updateAriaLabel = (el) => {
  const label = el.mediaPaused ? verbs.PLAY() : verbs.PAUSE();
  el.setAttribute("aria-label", label);
};
class MediaPlayButton extends MediaChromeButton {
  static get observedAttributes() {
    return [
      ...super.observedAttributes,
      MediaUIAttributes.MEDIA_PAUSED,
      MediaUIAttributes.MEDIA_ENDED
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
    if (attrName === MediaUIAttributes.MEDIA_PAUSED) {
      updateAriaLabel(this);
    }
    super.attributeChangedCallback(attrName, oldValue, newValue);
  }
  /**
   * Is the media paused
   */
  get mediaPaused() {
    return getBooleanAttr(this, MediaUIAttributes.MEDIA_PAUSED);
  }
  set mediaPaused(value) {
    setBooleanAttr(this, MediaUIAttributes.MEDIA_PAUSED, value);
  }
  handleClick() {
    const eventName = this.mediaPaused ? MediaUIEvents.MEDIA_PLAY_REQUEST : MediaUIEvents.MEDIA_PAUSE_REQUEST;
    this.dispatchEvent(
      new globalThis.CustomEvent(eventName, { composed: true, bubbles: true })
    );
  }
}
if (!globalThis.customElements.get("media-play-button")) {
  globalThis.customElements.define("media-play-button", MediaPlayButton);
}
var media_play_button_default = MediaPlayButton;
export {
  MediaPlayButton,
  media_play_button_default as default
};
