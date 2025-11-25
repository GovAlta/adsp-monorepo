'use strict';

var getFormattedDate = ((date = new Date())=>{
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toJSON().replace(/[-:]/g, '.').replace(/\....Z/, '');
});

module.exports = getFormattedDate;
//# sourceMappingURL=get-formatted-date.js.map
