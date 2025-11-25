const visitor = ({ schema, key, value }, { set })=>{
    if (key === '' && value === '*') {
        const { attributes } = schema;
        const newPopulateQuery = Object.entries(attributes).filter(([, attribute])=>[
                'relation',
                'component',
                'media',
                'dynamiczone'
            ].includes(attribute.type)).reduce((acc, [key])=>({
                ...acc,
                [key]: true
            }), {});
        set('', newPopulateQuery);
    }
};

export { visitor as default };
//# sourceMappingURL=expand-wildcard-populate.mjs.map
