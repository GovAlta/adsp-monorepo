const hasNamespace = (name, namespace)=>{
    if (!namespace) {
        return true;
    }
    if (namespace.endsWith('::')) {
        return name.startsWith(namespace);
    }
    return name.startsWith(`${namespace}.`);
};
const addNamespace = (name, namespace)=>{
    if (namespace.endsWith('::')) {
        return `${namespace}${name}`;
    }
    return `${namespace}.${name}`;
};
const removeNamespace = (name, namespace)=>{
    if (namespace.endsWith('::')) {
        return name.replace(namespace, '');
    }
    return name.replace(`${namespace}.`, '');
};

export { addNamespace, hasNamespace, removeNamespace };
//# sourceMappingURL=namespace.mjs.map
