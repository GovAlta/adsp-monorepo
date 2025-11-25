/**
 * Used to store user configurations related to media files.
 * E.g the size optimization flag, the responsive dimensions flag and the auto orientation.
 */
import { errors } from '@strapi/utils';
import type { Utils } from '@strapi/types';
export interface Settings {
    data: {
        sizeOptimization?: boolean;
        responsiveDimensions?: boolean;
        autoOrientation?: boolean;
        videoPreview?: boolean;
        aiMetadata?: boolean;
    };
}
export type SettingsData = Settings['data'];
/**
 * GET /upload/settings
 *
 * Return the stored settings for the media files.
 */
export declare namespace GetSettings {
    interface Request {
        query?: {};
    }
    interface Response {
        data: Settings;
    }
}
/**
 * PUT /upload/settings
 *
 * Update the stored settings
 */
export declare namespace UpdateSettings {
    interface Request {
        body: Settings['data'];
    }
    type Response = Utils.OneOf<{
        data: Settings['data'];
    }, {
        error?: errors.ApplicationError | errors.ValidationError;
    }>;
}
