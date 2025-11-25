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
var _rates;
import { globalThis, document } from "../utils/server-safe-globals.js";
import { MediaUIAttributes } from "../constants.js";
import { nouns, tooltipLabels } from "../labels/labels.js";
import { MediaChromeMenuButton } from "./media-chrome-menu-button.js";
import { AttributeTokenList } from "../utils/attribute-token-list.js";
import {
  getNumericAttr,
  setNumericAttr,
  getMediaController
} from "../utils/element-utils.js";
const Attributes = {
  RATES: "rates"
};
const DEFAULT_RATES = [1, 1.2, 1.5, 1.7, 2];
const DEFAULT_RATE = 1;
const slotTemplate = document.createElement("template");
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
class MediaPlaybackRateMenuButton extends MediaChromeMenuButton {
  constructor(options = {}) {
    super({
      slotTemplate,
      tooltipContent: tooltipLabels.PLAYBACK_RATE,
      ...options
    });
    __privateAdd(this, _rates, new AttributeTokenList(this, Attributes.RATES, {
      defaultValue: DEFAULT_RATES
    }));
    this.container = this.shadowRoot.querySelector('slot[name="icon"]');
    this.container.innerHTML = `${DEFAULT_RATE}x`;
  }
  static get observedAttributes() {
    return [
      ...super.observedAttributes,
      MediaUIAttributes.MEDIA_PLAYBACK_RATE,
      Attributes.RATES
    ];
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    super.attributeChangedCallback(attrName, oldValue, newValue);
    if (attrName === Attributes.RATES) {
      __privateGet(this, _rates).value = newValue;
    }
    if (attrName === MediaUIAttributes.MEDIA_PLAYBACK_RATE) {
      const newPlaybackRate = newValue ? +newValue : Number.NaN;
      const playbackRate = !Number.isNaN(newPlaybackRate) ? newPlaybackRate : DEFAULT_RATE;
      this.container.innerHTML = `${playbackRate}x`;
      this.setAttribute("aria-label", nouns.PLAYBACK_RATE({ playbackRate }));
    }
  }
  /**
   * Returns the element with the id specified by the `invoketarget` attribute.
   */
  get invokeTargetElement() {
    if (this.invokeTarget != void 0)
      return super.invokeTargetElement;
    return getMediaController(this).querySelector("media-playback-rate-menu");
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
    return getNumericAttr(
      this,
      MediaUIAttributes.MEDIA_PLAYBACK_RATE,
      DEFAULT_RATE
    );
  }
  set mediaPlaybackRate(value) {
    setNumericAttr(this, MediaUIAttributes.MEDIA_PLAYBACK_RATE, value);
  }
}
_rates = new WeakMap();
if (!globalThis.customElements.get("media-playback-rate-menu-button")) {
  globalThis.customElements.define(
    "media-playback-rate-menu-button",
    MediaPlaybackRateMenuButton
  );
}
var media_playback_rate_menu_button_default = MediaPlaybackRateMenuButton;
export {
  Attributes,
  DEFAULT_RATE,
  DEFAULT_RATES,
  MediaPlaybackRateMenuButton,
  media_playback_rate_menu_button_default as default
};
