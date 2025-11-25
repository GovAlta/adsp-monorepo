import { format } from 'winston';

var levelFilter = ((...levels)=>{
    return format((info)=>levels.some((level)=>info.level.includes(level)) ? info : false)();
});

export { levelFilter as default };
//# sourceMappingURL=level-filter.mjs.map
