import { useGetWebhooksQuery, useCreateWebhookMutation, useUpdateWebhookMutation, useTriggerWebhookMutation, useDeleteManyWebhooksMutation } from '../../../../../services/webhooks.mjs';

const useWebhooks = (args = undefined, queryArgs)=>{
    const { data: webhooks, isLoading, error } = useGetWebhooksQuery(args, queryArgs);
    const [createWebhook, { error: createError }] = useCreateWebhookMutation();
    const [updateWebhook, { error: updateError }] = useUpdateWebhookMutation();
    const [triggerWebhook] = useTriggerWebhookMutation();
    const [deleteManyWebhooks] = useDeleteManyWebhooksMutation();
    return {
        webhooks: webhooks,
        isLoading: isLoading,
        error: error || createError || updateError,
        createWebhook,
        updateWebhook,
        triggerWebhook,
        deleteManyWebhooks
    };
};

export { useWebhooks };
//# sourceMappingURL=useWebhooks.mjs.map
