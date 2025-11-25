import get from 'lodash/get';

const retrieveComponentsThatHaveComponents = (allComponents)=>{
    const componentsThatHaveNestedComponents = Object.keys(allComponents).reduce((acc, current)=>{
        const currentComponent = get(allComponents, [
            current
        ]);
        const compoWithChildren = getComponentWithChildComponents(currentComponent);
        if (compoWithChildren.childComponents.length > 0) {
            acc.push(compoWithChildren);
        }
        return acc;
    }, []);
    return componentsThatHaveNestedComponents;
};
const getComponentWithChildComponents = (component)=>{
    return {
        component: component.uid,
        childComponents: component.attributes.filter((attribute)=>{
            const { type } = attribute;
            return type === 'component';
        }).map((attribute)=>{
            return {
                component: attribute.component
            };
        })
    };
};

export { getComponentWithChildComponents, retrieveComponentsThatHaveComponents };
//# sourceMappingURL=retrieveComponentsThatHaveComponents.mjs.map
