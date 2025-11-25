import type { EditLayout } from '@strapi/content-manager/strapi-admin';
interface MutateEditViewArgs {
    layout: EditLayout;
}
declare const mutateEditViewHook: ({ layout }: MutateEditViewArgs) => MutateEditViewArgs;
export { mutateEditViewHook };
