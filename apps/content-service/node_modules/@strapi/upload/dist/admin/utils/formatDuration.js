'use strict';

var dateFns = require('date-fns');

const zeroPad = (num)=>String(num).padStart(2, '0');
const formatDuration = (durationInSecond)=>{
    const duration = dateFns.intervalToDuration({
        start: 0,
        end: durationInSecond * 1000
    });
    return `${zeroPad(duration.hours)}:${zeroPad(duration.minutes)}:${zeroPad(duration.seconds)}`;
};

exports.formatDuration = formatDuration;
//# sourceMappingURL=formatDuration.js.map
