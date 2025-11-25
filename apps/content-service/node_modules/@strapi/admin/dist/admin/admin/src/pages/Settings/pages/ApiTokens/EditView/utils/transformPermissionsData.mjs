const transformPermissionsData = (data)=>{
    const layout = {
        allActionsIds: [],
        permissions: []
    };
    layout.permissions = Object.entries(data).map(([apiId, permission])=>({
            apiId,
            label: apiId.split('::')[1],
            controllers: Object.keys(permission.controllers).map((controller)=>({
                    controller,
                    actions: controller in permission.controllers ? permission.controllers[controller].map((action)=>{
                        const actionId = `${apiId}.${controller}.${action}`;
                        if (apiId.includes('api::')) {
                            layout.allActionsIds.push(actionId);
                        }
                        return {
                            action,
                            actionId
                        };
                    }).flat() : []
                })).flat()
        }));
    return layout;
};

export { transformPermissionsData };
//# sourceMappingURL=transformPermissionsData.mjs.map
