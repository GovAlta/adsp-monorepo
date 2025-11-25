import { errors } from '@strapi/utils';
/**
 * /providers/isSSOLocked
 */
export declare namespace IsSSOLocked {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: {
            isSSOLocked: boolean;
        };
        error?: errors.ApplicationError;
    }
}
export interface Provider {
    displayName: string;
    icon?: string | null;
    uid: string;
}
/**
 * /providers
 */
export declare namespace GetProviders {
    interface Request {
        body: {};
        query: {};
    }
    /**
     * TODO: this should follow the expected pattern of returning `data` as an object.
     */
    type Response = Provider[];
}
