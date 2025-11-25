import ___default from 'lodash';

const checkFieldsDontHaveDuplicates = (fields)=>{
    if (___default.isNil(fields)) {
        // Only check if the fields exist
        return true;
    }
    if (!Array.isArray(fields)) {
        return false;
    }
    return ___default.uniq(fields).length === fields.length;
};

export { checkFieldsDontHaveDuplicates as default };
//# sourceMappingURL=check-fields-dont-have-duplicates.mjs.map
