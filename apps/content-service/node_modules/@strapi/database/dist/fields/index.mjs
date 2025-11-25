import _ from 'lodash/fp';
import Field from './field.mjs';
import StringField from './string.mjs';
import JSONField from './json.mjs';
import BigIntegerField from './biginteger.mjs';
import NumberField from './number.mjs';
import DateField from './date.mjs';
import TimeField from './time.mjs';
import DatetimeField from './datetime.mjs';
import TimestampField from './timestamp.mjs';
import BooleanField from './boolean.mjs';

const typeToFieldMap = {
    increments: Field,
    password: StringField,
    email: StringField,
    string: StringField,
    uid: StringField,
    richtext: StringField,
    text: StringField,
    enumeration: StringField,
    json: JSONField,
    biginteger: BigIntegerField,
    integer: NumberField,
    float: NumberField,
    decimal: NumberField,
    date: DateField,
    time: TimeField,
    datetime: DatetimeField,
    timestamp: TimestampField,
    boolean: BooleanField,
    blocks: JSONField
};
const createField = (attribute)=>{
    const { type } = attribute;
    if (_.has(type, typeToFieldMap)) {
        return new typeToFieldMap[type]({});
    }
    throw new Error(`Undefined field for type ${type}`);
};

export { createField };
//# sourceMappingURL=index.mjs.map
