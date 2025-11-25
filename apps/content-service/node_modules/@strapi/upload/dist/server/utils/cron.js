'use strict';

const getWeeklyCronScheduleAt = (date)=>`${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} * * ${date.getDay()}`;

exports.getWeeklyCronScheduleAt = getWeeklyCronScheduleAt;
//# sourceMappingURL=cron.js.map
