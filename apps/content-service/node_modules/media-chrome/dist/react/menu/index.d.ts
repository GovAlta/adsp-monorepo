import type React from 'react';

import type * as CSS from 'csstype';
declare global {
  interface Element {
    slot?: string;
  }
}

declare module 'csstype' {
  interface Properties {
    // Should add generic support for any CSS variables
    [index: `--${string}`]: any;
  }
}

type GenericProps = { [k: string]: any };
type GenericElement = HTMLElement;

type GenericForwardRef = React.ForwardRefExoticComponent<
  GenericProps & React.RefAttributes<GenericElement | undefined>
>;

declare const MediaChromeMenu: GenericForwardRef;
export { MediaChromeMenu };

declare const MediaChromeMenuItem: GenericForwardRef;
export { MediaChromeMenuItem };

declare const MediaSettingsMenu: GenericForwardRef;
export { MediaSettingsMenu };

declare const MediaSettingsMenuItem: GenericForwardRef;
export { MediaSettingsMenuItem };

declare const MediaChromeMenuButton: GenericForwardRef;
export { MediaChromeMenuButton };

declare const MediaSettingsMenuButton: GenericForwardRef;
export { MediaSettingsMenuButton };

declare const MediaAudioTrackMenu: GenericForwardRef;
export { MediaAudioTrackMenu };

declare const MediaAudioTrackMenuButton: GenericForwardRef;
export { MediaAudioTrackMenuButton };

declare const MediaCaptionsMenu: GenericForwardRef;
export { MediaCaptionsMenu };

declare const MediaCaptionsMenuButton: GenericForwardRef;
export { MediaCaptionsMenuButton };

declare const MediaPlaybackRateMenu: GenericForwardRef;
export { MediaPlaybackRateMenu };

declare const MediaPlaybackRateMenuButton: GenericForwardRef;
export { MediaPlaybackRateMenuButton };

declare const MediaRenditionMenu: GenericForwardRef;
export { MediaRenditionMenu };

declare const MediaRenditionMenuButton: GenericForwardRef;
export { MediaRenditionMenuButton };
