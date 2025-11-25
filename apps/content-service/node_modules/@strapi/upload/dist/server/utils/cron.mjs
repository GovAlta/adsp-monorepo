const getWeeklyCronScheduleAt = (date)=>`${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} * * ${date.getDay()}`;

export { getWeeklyCronScheduleAt };
//# sourceMappingURL=cron.mjs.map
