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

declare const MediaGestureReceiver: GenericForwardRef;
export { MediaGestureReceiver };

declare const MediaContainer: GenericForwardRef;
export { MediaContainer };

declare const MediaController: GenericForwardRef;
export { MediaController };

declare const MediaChromeButton: GenericForwardRef;
export { MediaChromeButton };

declare const MediaAirplayButton: GenericForwardRef;
export { MediaAirplayButton };

declare const MediaCaptionsButton: GenericForwardRef;
export { MediaCaptionsButton };

declare const MediaCastButton: GenericForwardRef;
export { MediaCastButton };

declare const MediaChromeDialog: GenericForwardRef;
export { MediaChromeDialog };

declare const MediaChromeRange: GenericForwardRef;
export { MediaChromeRange };

declare const MediaControlBar: GenericForwardRef;
export { MediaControlBar };

declare const MediaTextDisplay: GenericForwardRef;
export { MediaTextDisplay };

declare const MediaDurationDisplay: GenericForwardRef;
export { MediaDurationDisplay };

declare const MediaFullscreenButton: GenericForwardRef;
export { MediaFullscreenButton };

declare const MediaLiveButton: GenericForwardRef;
export { MediaLiveButton };

declare const MediaLoadingIndicator: GenericForwardRef;
export { MediaLoadingIndicator };

declare const MediaMuteButton: GenericForwardRef;
export { MediaMuteButton };

declare const MediaPipButton: GenericForwardRef;
export { MediaPipButton };

declare const MediaPlaybackRateButton: GenericForwardRef;
export { MediaPlaybackRateButton };

declare const MediaPlayButton: GenericForwardRef;
export { MediaPlayButton };

declare const MediaPosterImage: GenericForwardRef;
export { MediaPosterImage };

declare const MediaPreviewChapterDisplay: GenericForwardRef;
export { MediaPreviewChapterDisplay };

declare const MediaPreviewThumbnail: GenericForwardRef;
export { MediaPreviewThumbnail };

declare const MediaPreviewTimeDisplay: GenericForwardRef;
export { MediaPreviewTimeDisplay };

declare const MediaSeekBackwardButton: GenericForwardRef;
export { MediaSeekBackwardButton };

declare const MediaSeekForwardButton: GenericForwardRef;
export { MediaSeekForwardButton };

declare const MediaTimeDisplay: GenericForwardRef;
export { MediaTimeDisplay };

declare const MediaTimeRange: GenericForwardRef;
export { MediaTimeRange };

declare const MediaTooltip: GenericForwardRef;
export { MediaTooltip };

declare const MediaVolumeRange: GenericForwardRef;
export { MediaVolumeRange };
