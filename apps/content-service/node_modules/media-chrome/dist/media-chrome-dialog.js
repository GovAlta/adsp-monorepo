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
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _previouslyFocused, _invokerElement, _handleOpen, handleOpen_fn, _handleClosed, handleClosed_fn, _handleInvoke, handleInvoke_fn, _handleFocusOut, handleFocusOut_fn, _handleKeyDown, handleKeyDown_fn;
import { globalThis, document } from "./utils/server-safe-globals.js";
import {
  containsComposedNode,
  getActiveElement
} from "./utils/element-utils.js";
const template = document.createElement("template");
template.innerHTML = /*html*/
`
  <style>
    :host {
      font: var(--media-font,
        var(--media-font-weight, normal)
        var(--media-font-size, 14px) /
        var(--media-text-content-height, var(--media-control-height, 24px))
        var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
      color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
      background: var(--media-dialog-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .8))));
      border-radius: var(--media-dialog-border-radius);
      border: var(--media-dialog-border, none);
      display: var(--media-dialog-display, inline-flex);
      transition: var(--media-dialog-transition-in,
        visibility 0s,
        opacity .2s ease-out,
        transform .15s ease-out
      ) !important;
      ${/* ^^Prevent transition override by media-container */
""}
      visibility: var(--media-dialog-visibility, visible);
      opacity: var(--media-dialog-opacity, 1);
      transform: var(--media-dialog-transform-in, translateY(0) scale(1));
    }

    :host([hidden]) {
      transition: var(--media-dialog-transition-out,
        visibility .15s ease-in,
        opacity .15s ease-in,
        transform .15s ease-in
      ) !important;
      visibility: var(--media-dialog-hidden-visibility, hidden);
      opacity: var(--media-dialog-hidden-opacity, 0);
      transform: var(--media-dialog-transform-out, translateY(2px) scale(.99));
      pointer-events: none;
    }
  </style>
  <slot></slot>
`;
const Attributes = {
  HIDDEN: "hidden",
  ANCHOR: "anchor"
};
class MediaChromeDialog extends globalThis.HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _handleOpen);
    __privateAdd(this, _handleClosed);
    __privateAdd(this, _handleInvoke);
    __privateAdd(this, _handleFocusOut);
    __privateAdd(this, _handleKeyDown);
    __privateAdd(this, _previouslyFocused, null);
    __privateAdd(this, _invokerElement, null);
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.nativeEl = this.constructor.template.content.cloneNode(true);
      this.shadowRoot.append(this.nativeEl);
    }
    this.addEventListener("invoke", this);
    this.addEventListener("focusout", this);
    this.addEventListener("keydown", this);
  }
  static get observedAttributes() {
    return [Attributes.HIDDEN, Attributes.ANCHOR];
  }
  handleEvent(event) {
    switch (event.type) {
      case "invoke":
        __privateMethod(this, _handleInvoke, handleInvoke_fn).call(this, event);
        break;
      case "focusout":
        __privateMethod(this, _handleFocusOut, handleFocusOut_fn).call(this, event);
        break;
      case "keydown":
        __privateMethod(this, _handleKeyDown, handleKeyDown_fn).call(this, event);
        break;
    }
  }
  connectedCallback() {
    if (!this.role) {
      this.role = "dialog";
    }
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === Attributes.HIDDEN && newValue !== oldValue) {
      if (this.hidden) {
        __privateMethod(this, _handleClosed, handleClosed_fn).call(this);
      } else {
        __privateMethod(this, _handleOpen, handleOpen_fn).call(this);
      }
    }
  }
  focus() {
    __privateSet(this, _previouslyFocused, getActiveElement());
    const focusable = this.querySelector(
      '[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]'
    );
    focusable == null ? void 0 : focusable.focus();
  }
  get keysUsed() {
    return ["Escape", "Tab"];
  }
}
_previouslyFocused = new WeakMap();
_invokerElement = new WeakMap();
_handleOpen = new WeakSet();
handleOpen_fn = function() {
  var _a;
  (_a = __privateGet(this, _invokerElement)) == null ? void 0 : _a.setAttribute("aria-expanded", "true");
  this.addEventListener("transitionend", () => this.focus(), { once: true });
};
_handleClosed = new WeakSet();
handleClosed_fn = function() {
  var _a;
  (_a = __privateGet(this, _invokerElement)) == null ? void 0 : _a.setAttribute("aria-expanded", "false");
};
_handleInvoke = new WeakSet();
handleInvoke_fn = function(event) {
  __privateSet(this, _invokerElement, event.relatedTarget);
  if (!containsComposedNode(this, event.relatedTarget)) {
    this.hidden = !this.hidden;
  }
};
_handleFocusOut = new WeakSet();
handleFocusOut_fn = function(event) {
  var _a;
  if (!containsComposedNode(this, event.relatedTarget)) {
    (_a = __privateGet(this, _previouslyFocused)) == null ? void 0 : _a.focus();
    if (__privateGet(this, _invokerElement) && __privateGet(this, _invokerElement) !== event.relatedTarget && !this.hidden) {
      this.hidden = true;
    }
  }
};
_handleKeyDown = new WeakSet();
handleKeyDown_fn = function(event) {
  var _a, _b, _c, _d, _e;
  const { key, ctrlKey, altKey, metaKey } = event;
  if (ctrlKey || altKey || metaKey) {
    return;
  }
  if (!this.keysUsed.includes(key)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (key === "Tab") {
    if (event.shiftKey) {
      (_b = (_a = this.previousElementSibling) == null ? void 0 : _a.focus) == null ? void 0 : _b.call(_a);
    } else {
      (_d = (_c = this.nextElementSibling) == null ? void 0 : _c.focus) == null ? void 0 : _d.call(_c);
    }
    this.blur();
  } else if (key === "Escape") {
    (_e = __privateGet(this, _previouslyFocused)) == null ? void 0 : _e.focus();
    this.hidden = true;
  }
};
MediaChromeDialog.template = template;
if (!globalThis.customElements.get("media-chrome-dialog")) {
  globalThis.customElements.define("media-chrome-dialog", MediaChromeDialog);
}
var media_chrome_dialog_default = MediaChromeDialog;
export {
  Attributes,
  MediaChromeDialog,
  media_chrome_dialog_default as default
};
