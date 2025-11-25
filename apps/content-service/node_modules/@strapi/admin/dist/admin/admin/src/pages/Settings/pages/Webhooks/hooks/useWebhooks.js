'use strict';

var webhooks = require('../../../../../services/webhooks.js');

const useWebhooks = (args = undefined, queryArgs)=>{
    const { data: webhooks$1, isLoading, error } = webhooks.useGetWebhooksQuery(args, queryArgs);
    const [createWebhook, { error: createError }] = webhooks.useCreateWebhookMutation();
    const [updateWebhook, { error: updateError }] = webhooks.useUpdateWebhookMutation();
    const [triggerWebhook] = webhooks.useTriggerWebhookMutation();
    const [deleteManyWebhooks] = webhooks.useDeleteManyWebhooksMutation();
    return {
        webhooks: webhooks$1,
        isLoading: isLoading,
        error: error || createError || updateError,
        createWebhook,
        updateWebhook,
        triggerWebhook,
        deleteManyWebhooks
    };
};

exports.useWebhooks = useWebhooks;
//# sourceMappingURL=useWebhooks.js.map
