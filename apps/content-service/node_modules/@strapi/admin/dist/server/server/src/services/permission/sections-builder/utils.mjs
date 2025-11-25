import { curry, pick, matchesProperty } from 'lodash/fp';

const isOfKind = (kind)=>matchesProperty('kind', kind);
const resolveContentType = (uid)=>{
    return strapi.contentTypes[uid];
};
const isNotInSubjects = (subjects)=>(uid)=>!subjects.find((subject)=>subject.uid === uid);
const hasProperty = curry((property, subject)=>{
    return !!subject.properties.find((prop)=>prop.value === property);
});
const getValidOptions = pick([
    'applyToProperties'
]);
const toSubjectTemplate = (ct)=>({
        uid: ct.uid,
        label: ct.info.singularName,
        properties: []
    });

export { getValidOptions, hasProperty, isNotInSubjects, isOfKind, resolveContentType, toSubjectTemplate };
//# sourceMappingURL=utils.mjs.map
