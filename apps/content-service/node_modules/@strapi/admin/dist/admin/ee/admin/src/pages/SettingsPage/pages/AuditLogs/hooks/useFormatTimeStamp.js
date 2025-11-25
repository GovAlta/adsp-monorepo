'use strict';

var parseISO = require('date-fns/parseISO');
var reactIntl = require('react-intl');

const useFormatTimeStamp = ()=>{
    const { formatDate } = reactIntl.useIntl();
    const formatTimeStamp = (value)=>{
        const date = parseISO(value);
        const formattedDate = formatDate(date, {
            dateStyle: 'long'
        });
        const formattedTime = formatDate(date, {
            timeStyle: 'medium',
            hourCycle: 'h24'
        });
        return `${formattedDate}, ${formattedTime}`;
    };
    return formatTimeStamp;
};

exports.useFormatTimeStamp = useFormatTimeStamp;
//# sourceMappingURL=useFormatTimeStamp.js.map
