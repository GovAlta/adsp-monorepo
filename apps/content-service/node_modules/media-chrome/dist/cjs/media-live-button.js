var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var media_live_button_exports = {};
__export(media_live_button_exports, {
  default: () => media_live_button_default
});
module.exports = __toCommonJS(media_live_button_exports);
var import_media_chrome_button = require("./media-chrome-button.js");
var import_server_safe_globals = require("./utils/server-safe-globals.js");
var import_constants = require("./constants.js");
var import_labels = require("./labels/labels.js");
var import_element_utils = require("./utils/element-utils.js");
const { MEDIA_TIME_IS_LIVE, MEDIA_PAUSED } = import_constants.MediaUIAttributes;
const { MEDIA_SEEK_TO_LIVE_REQUEST, MEDIA_PLAY_REQUEST } = import_constants.MediaUIEvents;
const indicatorSVG = '<svg viewBox="0 0 6 12"><circle cx="3" cy="6" r="2"></circle></svg>';
const slotTemplate = import_server_safe_globals.document.createElement("template");
slotTemplate.innerHTML = /*html*/
`
  <style>
  :host { --media-tooltip-display: none; }
  
  slot[name=indicator] > *,
  :host ::slotted([slot=indicator]) {
    ${/* Override styles for icon-only buttons */
""}
    min-width: auto;
    fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
    color: var(--media-live-button-icon-color, rgb(140, 140, 140));
  }

  :host([${MEDIA_TIME_IS_LIVE}]:not([${MEDIA_PAUSED}])) slot[name=indicator] > *,
  :host([${MEDIA_TIME_IS_LIVE}]:not([${MEDIA_PAUSED}])) ::slotted([slot=indicator]) {
    fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
    color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
  }

  :host([${MEDIA_TIME_IS_LIVE}]:not([${MEDIA_PAUSED}])) {
    cursor: not-allowed;
  }

  </style>

  <slot name="indicator">${indicatorSVG}</slot>
  ${/*
  A new line between spacer and text creates inconsistent spacing
  between slotted items and default slots.
*/
""}
  <slot name="spacer">&nbsp;</slot><slot name="text">LIVE</slot>
`;
const updateAriaAttributes = (el) => {
  const isPausedOrNotLive = el.mediaPaused || !el.mediaTimeIsLive;
  const label = isPausedOrNotLive ? import_labels.verbs.SEEK_LIVE() : import_labels.verbs.PLAYING_LIVE();
  el.setAttribute("aria-label", label);
  isPausedOrNotLive ? el.removeAttribute("aria-disabled") : el.setAttribute("aria-disabled", "true");
};
class MediaLiveButton extends import_media_chrome_button.MediaChromeButton {
  static get observedAttributes() {
    return [...super.observedAttributes, MEDIA_PAUSED, MEDIA_TIME_IS_LIVE];
  }
  constructor(options = {}) {
    super({ slotTemplate, ...options });
  }
  connectedCallback() {
    updateAriaAttributes(this);
    super.connectedCallback();
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    super.attributeChangedCallback(attrName, oldValue, newValue);
    updateAriaAttributes(this);
  }
  /**
   * @type {boolean} Is the media paused
   */
  get mediaPaused() {
    return (0, import_element_utils.getBooleanAttr)(this, import_constants.MediaUIAttributes.MEDIA_PAUSED);
  }
  set mediaPaused(value) {
    (0, import_element_utils.setBooleanAttr)(this, import_constants.MediaUIAttributes.MEDIA_PAUSED, value);
  }
  /**
   * @type {boolean} Is the media playback currently live
   */
  get mediaTimeIsLive() {
    return (0, import_element_utils.getBooleanAttr)(this, import_constants.MediaUIAttributes.MEDIA_TIME_IS_LIVE);
  }
  set mediaTimeIsLive(value) {
    (0, import_element_utils.setBooleanAttr)(this, import_constants.MediaUIAttributes.MEDIA_TIME_IS_LIVE, value);
  }
  handleClick() {
    if (!this.mediaPaused && this.mediaTimeIsLive)
      return;
    this.dispatchEvent(
      new import_server_safe_globals.globalThis.CustomEvent(MEDIA_SEEK_TO_LIVE_REQUEST, {
        composed: true,
        bubbles: true
      })
    );
    if (this.hasAttribute(MEDIA_PAUSED)) {
      this.dispatchEvent(
        new import_server_safe_globals.globalThis.CustomEvent(MEDIA_PLAY_REQUEST, {
          composed: true,
          bubbles: true
        })
      );
    }
  }
}
if (!import_server_safe_globals.globalThis.customElements.get("media-live-button")) {
  import_server_safe_globals.globalThis.customElements.define("media-live-button", MediaLiveButton);
}
var media_live_button_default = MediaLiveButton;
