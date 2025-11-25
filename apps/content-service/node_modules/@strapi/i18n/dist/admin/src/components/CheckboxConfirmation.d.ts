import { MessageDescriptor } from 'react-intl';
interface IntlMessage extends MessageDescriptor {
    values: object;
}
interface CheckboxConfirmationProps {
    description: IntlMessage;
    intlLabel: IntlMessage;
    isCreating?: boolean;
    name: string;
    onChange: (event: {
        target: {
            name: string;
            value: boolean;
            type: string;
        };
    }) => void;
    value: boolean;
}
declare const CheckboxConfirmation: ({ description, isCreating, intlLabel, name, onChange, value, }: CheckboxConfirmationProps) => import("react/jsx-runtime").JSX.Element;
export { CheckboxConfirmation };
