import ___default from 'lodash';

const checkFieldsAreCorrectlyNested = (fields)=>{
    if (___default.isNil(fields)) {
        // Only check if the fields exist
        return true;
    }
    if (!Array.isArray(fields)) {
        return false;
    }
    let failed = false;
    for(let indexA = 0; indexA < fields.length; indexA += 1){
        failed = fields.slice(indexA + 1).some((fieldB)=>fieldB.startsWith(`${fields[indexA]}.`) || fields[indexA].startsWith(`${fieldB}.`));
        if (failed) break;
    }
    return !failed;
};

export { checkFieldsAreCorrectlyNested as default };
//# sourceMappingURL=check-fields-are-correctly-nested.mjs.map
