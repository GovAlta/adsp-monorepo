var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var menu_exports = {};
__export(menu_exports, {
  MediaAudioTrackMenu: () => MediaAudioTrackMenu,
  MediaAudioTrackMenuButton: () => MediaAudioTrackMenuButton,
  MediaCaptionsMenu: () => MediaCaptionsMenu,
  MediaCaptionsMenuButton: () => MediaCaptionsMenuButton,
  MediaChromeMenu: () => MediaChromeMenu,
  MediaChromeMenuButton: () => MediaChromeMenuButton,
  MediaChromeMenuItem: () => MediaChromeMenuItem,
  MediaPlaybackRateMenu: () => MediaPlaybackRateMenu,
  MediaPlaybackRateMenuButton: () => MediaPlaybackRateMenuButton,
  MediaRenditionMenu: () => MediaRenditionMenu,
  MediaRenditionMenuButton: () => MediaRenditionMenuButton,
  MediaSettingsMenu: () => MediaSettingsMenu,
  MediaSettingsMenuButton: () => MediaSettingsMenuButton,
  MediaSettingsMenuItem: () => MediaSettingsMenuItem
});
module.exports = __toCommonJS(menu_exports);
var import_react = __toESM(require("react"), 1);
var import_menu = require("../../menu/index.js");
var import_utils = require("../common/utils.js");
const MediaChromeMenu = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-chrome-menu", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaChromeMenuItem = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-chrome-menu-item", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaSettingsMenu = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-settings-menu", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaSettingsMenuItem = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-settings-menu-item", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaChromeMenuButton = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-chrome-menu-button", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaSettingsMenuButton = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-settings-menu-button", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaAudioTrackMenu = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-audio-track-menu", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaAudioTrackMenuButton = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-audio-track-menu-button", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaCaptionsMenu = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-captions-menu", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaCaptionsMenuButton = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-captions-menu-button", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaPlaybackRateMenu = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-playback-rate-menu", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaPlaybackRateMenuButton = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-playback-rate-menu-button", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaRenditionMenu = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-rendition-menu", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
const MediaRenditionMenuButton = import_react.default.forwardRef(({ children = [], ...props }, ref) => {
  return import_react.default.createElement("media-rendition-menu-button", { ...(0, import_utils.toNativeProps)(props), ref, suppressHydrationWarning: true }, children);
});
