import type { Data } from '@strapi/types';
interface ModalFormProps {
    onToggle: () => void;
}
declare const ModalForm: ({ onToggle }: ModalFormProps) => import("react/jsx-runtime").JSX.Element | null;
interface InitialData {
    firstname?: string;
    lastname?: string;
    email?: string;
    roles?: Data.ID[];
    useSSORegistration?: boolean;
}
export { ModalForm };
export type { InitialData };
