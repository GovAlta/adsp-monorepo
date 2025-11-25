'use strict';

var fp = require('lodash/fp');

const formatYupInnerError = (yupError)=>({
        path: fp.toPath(yupError.path),
        message: yupError.message,
        name: yupError.name,
        value: yupError.value
    });
const formatYupErrors = (yupError)=>({
        errors: fp.isEmpty(yupError.inner) ? [
            formatYupInnerError(yupError)
        ] : yupError.inner.map(formatYupInnerError),
        message: yupError.message
    });

exports.formatYupErrors = formatYupErrors;
//# sourceMappingURL=format-yup-error.js.map
