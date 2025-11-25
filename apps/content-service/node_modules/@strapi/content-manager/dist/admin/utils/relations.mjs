/**
 * @internal
 * @description Get the label of a relation, the contract has [key: string]: unknown,
 * so we need to check if the mainFieldKey is defined and if the relation has a value
 * under that property. If it does, we then verify it's type of string and return it.
 *
 * We fallback to the documentId.
 */ const getRelationLabel = (relation, mainField)=>{
    const label = mainField && relation[mainField.name] ? relation[mainField.name] : null;
    if (typeof label === 'string') {
        return label;
    }
    return relation.documentId;
};

export { getRelationLabel };
//# sourceMappingURL=relations.mjs.map
