const retrieveNestedComponents = (appComponents)=>{
    const nestedComponents = Object.keys(appComponents).reduce((acc, current)=>{
        const componentAttributes = appComponents?.[current]?.attributes ?? [];
        const currentComponentNestedCompos = getComponentsNestedWithinComponent(componentAttributes, current);
        return [
            ...acc,
            ...currentComponentNestedCompos
        ];
    }, []);
    return mergeComponents(nestedComponents);
};
const getComponentsNestedWithinComponent = (componentAttributes, parentCompoUid)=>{
    return componentAttributes.reduce((acc, current)=>{
        const { type } = current;
        if (type === 'component') {
            acc.push({
                component: current.component,
                parentCompoUid
            });
        }
        return acc;
    }, []);
};
// Merge duplicate components
const mergeComponents = (originalComponents)=>{
    const componentMap = new Map();
    // Populate the map with component and its parents
    originalComponents.forEach(({ component, parentCompoUid })=>{
        if (!componentMap.has(component)) {
            componentMap.set(component, new Set());
        }
        componentMap.get(component).add(parentCompoUid);
    });
    // Convert the map to the desired array format
    const transformedComponents = Array.from(componentMap.entries()).map(([component, parentCompoUidSet])=>({
            component,
            uidsOfAllParents: Array.from(parentCompoUidSet)
        }));
    return transformedComponents;
};

export { retrieveNestedComponents };
//# sourceMappingURL=retrieveNestedComponents.mjs.map
