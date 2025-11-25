'use strict';

const extractValuesFromYupError = (errorType, errorParams)=>{
    if (!errorType || !errorParams) {
        return {};
    }
    return {
        [errorType]: errorParams[errorType]
    };
};
const getYupInnerErrors = (error)=>(error?.inner || []).reduce((acc, currentError)=>{
        if (currentError.path) {
            acc[currentError.path.split('[').join('.').split(']').join('')] = {
                id: currentError.message,
                defaultMessage: currentError.message,
                values: extractValuesFromYupError(currentError?.type, currentError?.params)
            };
        }
        return acc;
    }, {});

exports.getYupInnerErrors = getYupInnerErrors;
//# sourceMappingURL=getYupInnerErrors.js.map
