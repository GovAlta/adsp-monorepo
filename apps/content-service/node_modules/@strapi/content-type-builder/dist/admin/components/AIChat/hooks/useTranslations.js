'use strict';

var reactIntl = require('react-intl');

const useTranslations = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const t = (id, defaultMessage)=>{
        return formatMessage({
            id,
            defaultMessage
        });
    };
    return {
        t
    };
};

exports.useTranslations = useTranslations;
//# sourceMappingURL=useTranslations.js.map
