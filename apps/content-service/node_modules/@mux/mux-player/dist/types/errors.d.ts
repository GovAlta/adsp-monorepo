import type { DialogOptions, DevlogOptions } from './types';
import { MediaError } from '@mux/playback-core';
export declare function getErrorLogs(error: MediaError, translate?: boolean): {
    dialog: DialogOptions;
    devlog: DevlogOptions;
};
