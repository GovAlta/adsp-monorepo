'use strict';

var fp = require('lodash/fp');

const isOfKind = (kind)=>fp.matchesProperty('kind', kind);
const resolveContentType = (uid)=>{
    return strapi.contentTypes[uid];
};
const isNotInSubjects = (subjects)=>(uid)=>!subjects.find((subject)=>subject.uid === uid);
const hasProperty = fp.curry((property, subject)=>{
    return !!subject.properties.find((prop)=>prop.value === property);
});
const getValidOptions = fp.pick([
    'applyToProperties'
]);
const toSubjectTemplate = (ct)=>({
        uid: ct.uid,
        label: ct.info.singularName,
        properties: []
    });

exports.getValidOptions = getValidOptions;
exports.hasProperty = hasProperty;
exports.isNotInSubjects = isNotInSubjects;
exports.isOfKind = isOfKind;
exports.resolveContentType = resolveContentType;
exports.toSubjectTemplate = toSubjectTemplate;
//# sourceMappingURL=utils.js.map
