import { isEmpty, toPath } from 'lodash/fp';

const formatYupInnerError = (yupError)=>({
        path: toPath(yupError.path),
        message: yupError.message,
        name: yupError.name,
        value: yupError.value
    });
const formatYupErrors = (yupError)=>({
        errors: isEmpty(yupError.inner) ? [
            formatYupInnerError(yupError)
        ] : yupError.inner.map(formatYupInnerError),
        message: yupError.message
    });

export { formatYupErrors };
//# sourceMappingURL=format-yup-error.mjs.map
