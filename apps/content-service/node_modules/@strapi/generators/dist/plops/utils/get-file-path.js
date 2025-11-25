'use strict';

var getFilePath = ((destination)=>{
    if (destination === 'api') {
        return `api/{{ api }}`;
    }
    if (destination === 'plugin') {
        return `plugins/{{ plugin }}/server`;
    }
    if (destination === 'root') {
        return './';
    }
    return `api/{{ id }}`;
});

module.exports = getFilePath;
//# sourceMappingURL=get-file-path.js.map
