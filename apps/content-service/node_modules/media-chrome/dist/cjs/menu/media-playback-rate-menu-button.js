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
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var media_playback_rate_menu_button_exports = {};
__export(media_playback_rate_menu_button_exports, {
  Attributes: () => Attributes,
  DEFAULT_RATE: () => DEFAULT_RATE,
  DEFAULT_RATES: () => DEFAULT_RATES,
  MediaPlaybackRateMenuButton: () => MediaPlaybackRateMenuButton,
  default: () => media_playback_rate_menu_button_default
});
module.exports = __toCommonJS(media_playback_rate_menu_button_exports);
var import_server_safe_globals = require("../utils/server-safe-globals.js");
var import_constants = require("../constants.js");
var import_labels = require("../labels/labels.js");
var import_media_chrome_menu_button = require("./media-chrome-menu-button.js");
var import_attribute_token_list = require("../utils/attribute-token-list.js");
var import_element_utils = require("../utils/element-utils.js");
var _rates;
const Attributes = {
  RATES: "rates"
};
const DEFAULT_RATES = [1, 1.2, 1.5, 1.7, 2];
const DEFAULT_RATE = 1;
const slotTemplate = import_server_safe_globals.document.createElement("template");
slotTemplate.innerHTML = /*html*/
`
  <style>
    :host {
      min-width: 5ch;
      padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
    }
    
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon"></slot>
`;
class MediaPlaybackRateMenuButton extends import_media_chrome_menu_button.MediaChromeMenuButton {
  constructor(options = {}) {
    super({
      slotTemplate,
      tooltipContent: import_labels.tooltipLabels.PLAYBACK_RATE,
      ...options
    });
    __privateAdd(this, _rates, new import_attribute_token_list.AttributeTokenList(this, Attributes.RATES, {
      defaultValue: DEFAULT_RATES
    }));
    this.container = this.shadowRoot.querySelector('slot[name="icon"]');
    this.container.innerHTML = `${DEFAULT_RATE}x`;
  }
  static get observedAttributes() {
    return [
      ...super.observedAttributes,
      import_constants.MediaUIAttributes.MEDIA_PLAYBACK_RATE,
      Attributes.RATES
    ];
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    super.attributeChangedCallback(attrName, oldValue, newValue);
    if (attrName === Attributes.RATES) {
      __privateGet(this, _rates).value = newValue;
    }
    if (attrName === import_constants.MediaUIAttributes.MEDIA_PLAYBACK_RATE) {
      const newPlaybackRate = newValue ? +newValue : Number.NaN;
      const playbackRate = !Number.isNaN(newPlaybackRate) ? newPlaybackRate : DEFAULT_RATE;
      this.container.innerHTML = `${playbackRate}x`;
      this.setAttribute("aria-label", import_labels.nouns.PLAYBACK_RATE({ playbackRate }));
    }
  }
  /**
   * Returns the element with the id specified by the `invoketarget` attribute.
   */
  get invokeTargetElement() {
    if (this.invokeTarget != void 0)
      return super.invokeTargetElement;
    return (0, import_element_utils.getMediaController)(this).querySelector("media-playback-rate-menu");
  }
  /**
   * Will return a DOMTokenList.
   * Setting a value will accept an array of numbers.
   */
  get rates() {
    return __privateGet(this, _rates);
  }
  set rates(value) {
    if (!value) {
      __privateGet(this, _rates).value = "";
    } else if (Array.isArray(value)) {
      __privateGet(this, _rates).value = value.join(" ");
    }
  }
  /**
   * The current playback rate
   */
  get mediaPlaybackRate() {
    return (0, import_element_utils.getNumericAttr)(
      this,
      import_constants.MediaUIAttributes.MEDIA_PLAYBACK_RATE,
      DEFAULT_RATE
    );
  }
  set mediaPlaybackRate(value) {
    (0, import_element_utils.setNumericAttr)(this, import_constants.MediaUIAttributes.MEDIA_PLAYBACK_RATE, value);
  }
}
_rates = new WeakMap();
if (!import_server_safe_globals.globalThis.customElements.get("media-playback-rate-menu-button")) {
  import_server_safe_globals.globalThis.customElements.define(
    "media-playback-rate-menu-button",
    MediaPlaybackRateMenuButton
  );
}
var media_playback_rate_menu_button_default = MediaPlaybackRateMenuButton;
