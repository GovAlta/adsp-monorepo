import createError from 'http-errors';
import { errors } from '@strapi/utils';
declare const formatApplicationError: (error: InstanceType<typeof errors.ApplicationError>) => {
    status: number;
    body: {
        data: null;
        error: {
            status: number;
            name: string;
            message: string;
            details: unknown;
        };
    };
};
declare const formatHttpError: (error: createError.HttpError) => {
    status: number;
    body: {
        data: null;
        error: {
            status: number;
            name: string;
            message: string;
            details: any;
        };
    };
};
declare const formatInternalError: (error: unknown) => {
    status: number;
    body: {
        data: null;
        error: {
            status: number;
            name: string;
            message: string;
            details: any;
        };
    };
};
export { formatApplicationError, formatHttpError, formatInternalError };
//# sourceMappingURL=errors.d.ts.map