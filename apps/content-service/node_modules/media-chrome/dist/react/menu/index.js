import React from "react";
import "../../menu/index.js";
import { toNativeProps } from "../common/utils.js";

/** @type { import("react").HTMLElement } */
const MediaChromeMenu = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-chrome-menu', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaChromeMenu };

/** @type { import("react").HTMLElement } */
const MediaChromeMenuItem = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-chrome-menu-item', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaChromeMenuItem };

/** @type { import("react").HTMLElement } */
const MediaSettingsMenu = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-settings-menu', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaSettingsMenu };

/** @type { import("react").HTMLElement } */
const MediaSettingsMenuItem = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-settings-menu-item', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaSettingsMenuItem };

/** @type { import("react").HTMLElement } */
const MediaChromeMenuButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-chrome-menu-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaChromeMenuButton };

/** @type { import("react").HTMLElement } */
const MediaSettingsMenuButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-settings-menu-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaSettingsMenuButton };

/** @type { import("react").HTMLElement } */
const MediaAudioTrackMenu = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-audio-track-menu', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaAudioTrackMenu };

/** @type { import("react").HTMLElement } */
const MediaAudioTrackMenuButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-audio-track-menu-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaAudioTrackMenuButton };

/** @type { import("react").HTMLElement } */
const MediaCaptionsMenu = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-captions-menu', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaCaptionsMenu };

/** @type { import("react").HTMLElement } */
const MediaCaptionsMenuButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-captions-menu-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaCaptionsMenuButton };

/** @type { import("react").HTMLElement } */
const MediaPlaybackRateMenu = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-playback-rate-menu', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPlaybackRateMenu };

/** @type { import("react").HTMLElement } */
const MediaPlaybackRateMenuButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-playback-rate-menu-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPlaybackRateMenuButton };

/** @type { import("react").HTMLElement } */
const MediaRenditionMenu = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-rendition-menu', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaRenditionMenu };

/** @type { import("react").HTMLElement } */
const MediaRenditionMenuButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-rendition-menu-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaRenditionMenuButton };
