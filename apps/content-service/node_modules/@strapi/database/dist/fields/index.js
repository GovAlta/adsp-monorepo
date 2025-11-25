'use strict';

var _ = require('lodash/fp');
var field = require('./field.js');
var string = require('./string.js');
var json = require('./json.js');
var biginteger = require('./biginteger.js');
var number = require('./number.js');
var date = require('./date.js');
var time = require('./time.js');
var datetime = require('./datetime.js');
var timestamp = require('./timestamp.js');
var boolean = require('./boolean.js');

const typeToFieldMap = {
    increments: field,
    password: string,
    email: string,
    string: string,
    uid: string,
    richtext: string,
    text: string,
    enumeration: string,
    json: json,
    biginteger: biginteger,
    integer: number,
    float: number,
    decimal: number,
    date: date,
    time: time,
    datetime: datetime,
    timestamp: timestamp,
    boolean: boolean,
    blocks: json
};
const createField = (attribute)=>{
    const { type } = attribute;
    if (_.has(type, typeToFieldMap)) {
        return new typeToFieldMap[type]({});
    }
    throw new Error(`Undefined field for type ${type}`);
};

exports.createField = createField;
//# sourceMappingURL=index.js.map
