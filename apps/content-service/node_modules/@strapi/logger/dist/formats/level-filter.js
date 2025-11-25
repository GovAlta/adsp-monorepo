'use strict';

var winston = require('winston');

var levelFilter = ((...levels)=>{
    return winston.format((info)=>levels.some((level)=>info.level.includes(level)) ? info : false)();
});

module.exports = levelFilter;
//# sourceMappingURL=level-filter.js.map
