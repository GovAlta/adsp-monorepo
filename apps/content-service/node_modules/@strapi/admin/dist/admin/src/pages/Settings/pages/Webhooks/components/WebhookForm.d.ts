import { TriggerWebhook } from '../../../../../../../shared/contracts/webhooks';
import { FormHelpers } from '../../../../../components/Form';
import type { Modules } from '@strapi/types';
interface WebhookFormValues {
    name: Modules.WebhookStore.Webhook['name'];
    url: Modules.WebhookStore.Webhook['url'];
    headers: Array<{
        key: string;
        value: string;
    }>;
    events: Modules.WebhookStore.Webhook['events'];
}
interface WebhookFormProps {
    data?: Modules.WebhookStore.Webhook;
    handleSubmit: (values: WebhookFormValues, helpers: FormHelpers<WebhookFormValues>) => Promise<void>;
    isCreating: boolean;
    isTriggering: boolean;
    triggerWebhook: () => void;
    triggerResponse?: TriggerWebhook.Response['data'];
}
declare const WebhookForm: ({ handleSubmit, triggerWebhook, isCreating, isTriggering, triggerResponse, data, }: WebhookFormProps) => import("react/jsx-runtime").JSX.Element | null;
export { WebhookForm };
export type { WebhookFormValues, WebhookFormProps };
