export type LabelOptions = {
    seekOffset?: number;
    playbackRate?: number;
};
export declare const tooltipLabels: {
    ENTER_AIRPLAY: string;
    EXIT_AIRPLAY: string;
    AUDIO_TRACK_MENU: string;
    CAPTIONS: string;
    ENABLE_CAPTIONS: string;
    DISABLE_CAPTIONS: string;
    START_CAST: string;
    STOP_CAST: string;
    ENTER_FULLSCREEN: string;
    EXIT_FULLSCREEN: string;
    MUTE: string;
    UNMUTE: string;
    ENTER_PIP: string;
    EXIT_PIP: string;
    PLAY: string;
    PAUSE: string;
    PLAYBACK_RATE: string;
    RENDITIONS: string;
    SEEK_BACKWARD: string;
    SEEK_FORWARD: string;
    SETTINGS: string;
};
export declare const nouns: Record<string, (options?: LabelOptions) => string>;
export declare const verbs: Record<string, (options?: LabelOptions) => string>;
declare const _default: {
    [x: string]: ((options?: LabelOptions) => string) | ((options?: LabelOptions) => string);
};
export default _default;
