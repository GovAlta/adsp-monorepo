import React from "react";
import "../media-theme-element.js";
import { toNativeProps } from "./common/utils.js";

/** @type { import("react").HTMLElement } */
const MediaTheme = React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement('media-theme', { ...toNativeProps(props), ref, suppressHydrationWarning: true }, children);
});

export { MediaTheme };
