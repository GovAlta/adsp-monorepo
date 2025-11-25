import { ValidationError } from 'yup';
declare const formatYupErrors: (yupError: ValidationError) => {
    errors: {
        path: string[];
        message: string;
        name: string;
        value: any;
    }[];
    message: string;
};
export { formatYupErrors };
//# sourceMappingURL=format-yup-error.d.ts.map