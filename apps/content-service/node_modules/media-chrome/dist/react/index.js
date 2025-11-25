import React from "react";
import "../index.js";
import { toNativeProps } from "./common/utils.js";

/** @type { import("react").HTMLElement } */
const MediaGestureReceiver = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-gesture-receiver', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaGestureReceiver };

/** @type { import("react").HTMLElement } */
const MediaContainer = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-container', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaContainer };

/** @type { import("react").HTMLElement } */
const MediaController = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-controller', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaController };

/** @type { import("react").HTMLElement } */
const MediaChromeButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-chrome-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaChromeButton };

/** @type { import("react").HTMLElement } */
const MediaAirplayButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-airplay-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaAirplayButton };

/** @type { import("react").HTMLElement } */
const MediaCaptionsButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-captions-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaCaptionsButton };

/** @type { import("react").HTMLElement } */
const MediaCastButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-cast-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaCastButton };

/** @type { import("react").HTMLElement } */
const MediaChromeDialog = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-chrome-dialog', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaChromeDialog };

/** @type { import("react").HTMLElement } */
const MediaChromeRange = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-chrome-range', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaChromeRange };

/** @type { import("react").HTMLElement } */
const MediaControlBar = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-control-bar', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaControlBar };

/** @type { import("react").HTMLElement } */
const MediaTextDisplay = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-text-display', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaTextDisplay };

/** @type { import("react").HTMLElement } */
const MediaDurationDisplay = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-duration-display', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaDurationDisplay };

/** @type { import("react").HTMLElement } */
const MediaFullscreenButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-fullscreen-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaFullscreenButton };

/** @type { import("react").HTMLElement } */
const MediaLiveButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-live-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaLiveButton };

/** @type { import("react").HTMLElement } */
const MediaLoadingIndicator = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-loading-indicator', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaLoadingIndicator };

/** @type { import("react").HTMLElement } */
const MediaMuteButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-mute-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaMuteButton };

/** @type { import("react").HTMLElement } */
const MediaPipButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-pip-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPipButton };

/** @type { import("react").HTMLElement } */
const MediaPlaybackRateButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-playback-rate-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPlaybackRateButton };

/** @type { import("react").HTMLElement } */
const MediaPlayButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-play-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPlayButton };

/** @type { import("react").HTMLElement } */
const MediaPosterImage = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-poster-image', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPosterImage };

/** @type { import("react").HTMLElement } */
const MediaPreviewChapterDisplay = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-preview-chapter-display', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPreviewChapterDisplay };

/** @type { import("react").HTMLElement } */
const MediaPreviewThumbnail = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-preview-thumbnail', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPreviewThumbnail };

/** @type { import("react").HTMLElement } */
const MediaPreviewTimeDisplay = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-preview-time-display', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaPreviewTimeDisplay };

/** @type { import("react").HTMLElement } */
const MediaSeekBackwardButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-seek-backward-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaSeekBackwardButton };

/** @type { import("react").HTMLElement } */
const MediaSeekForwardButton = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-seek-forward-button', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaSeekForwardButton };

/** @type { import("react").HTMLElement } */
const MediaTimeDisplay = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-time-display', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaTimeDisplay };

/** @type { import("react").HTMLElement } */
const MediaTimeRange = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-time-range', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaTimeRange };

/** @type { import("react").HTMLElement } */
const MediaTooltip = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-tooltip', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaTooltip };

/** @type { import("react").HTMLElement } */
const MediaVolumeRange = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-volume-range', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaVolumeRange };
