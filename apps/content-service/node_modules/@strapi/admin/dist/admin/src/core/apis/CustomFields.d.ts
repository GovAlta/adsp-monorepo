import { ComponentType } from 'react';
import type { MessageDescriptor, PrimitiveType } from 'react-intl';
import type { AnySchema } from 'yup';
type CustomFieldOptionInput = 'text' | 'checkbox' | 'checkbox-with-number-field' | 'select-default-boolean' | 'date' | 'select' | 'number' | 'boolean-radio-group' | 'select-date' | 'text-area-enum' | 'select-number' | 'radio-group';
type CustomFieldOptionName = 'min' | 'minLength' | 'max' | 'maxLength' | 'required' | 'regex' | 'enum' | 'unique' | 'private' | 'default';
interface CustomFieldOption {
    intlLabel: MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    };
    description: MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    };
    name: CustomFieldOptionName;
    type: CustomFieldOptionInput;
    defaultValue?: string | number | boolean | Date;
}
interface CustomFieldOptionSection {
    sectionTitle: (MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    }) | null;
    items: CustomFieldOption[];
}
interface CustomFieldOptions {
    base?: (CustomFieldOptionSection | CustomFieldOption)[];
    advanced?: (CustomFieldOptionSection | CustomFieldOption)[];
    validator?: () => Record<string, AnySchema>;
}
interface CustomField {
    name: string;
    pluginId?: string;
    type: (typeof ALLOWED_TYPES)[number];
    intlLabel: MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    };
    intlDescription: MessageDescriptor & {
        values?: Record<string, PrimitiveType>;
    };
    icon?: ComponentType;
    components: {
        Input: () => Promise<{
            default?: ComponentType;
        }>;
    };
    options?: CustomFieldOptions;
}
declare const ALLOWED_TYPES: readonly ["biginteger", "boolean", "date", "datetime", "decimal", "email", "enumeration", "float", "integer", "json", "password", "richtext", "string", "text", "time", "uid"];
declare class CustomFields {
    customFields: Record<string, CustomField>;
    constructor();
    register: (customFields: CustomField | CustomField[]) => void;
    getAll: () => Record<string, CustomField>;
    get: (uid: string) => CustomField | undefined;
}
export { type CustomField, CustomFields };
