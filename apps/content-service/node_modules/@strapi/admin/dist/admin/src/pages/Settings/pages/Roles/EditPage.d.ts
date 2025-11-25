/**
 * TODO: be nice if we could just infer this from the schema
 */
interface EditRoleFormValues {
    name: string;
    description: string;
}
declare const EditPage: () => import("react/jsx-runtime").JSX.Element;
declare const ProtectedEditPage: () => import("react/jsx-runtime").JSX.Element;
export { EditPage, ProtectedEditPage };
export type { EditRoleFormValues };
