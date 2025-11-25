import type { errors } from '@strapi/utils';
import { Release } from './releases';
export declare namespace GetUpcomingReleases {
    interface Request {
        body: {};
    }
    interface Response {
        data: Release[];
        error?: errors.ApplicationError;
    }
}
