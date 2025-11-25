'use strict';

class Field {
    toDB(value) {
        return value;
    }
    fromDB(value) {
        return value;
    }
    constructor(config){
        this.config = config;
    }
}

module.exports = Field;
//# sourceMappingURL=field.js.map
