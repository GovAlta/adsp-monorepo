import type { MessageDescriptor, PrimitiveType } from 'react-intl';
import type { ValidationError } from 'yup';
interface TranslationMessage extends MessageDescriptor {
    values?: Record<string, PrimitiveType>;
}
declare const getYupInnerErrors: (error: ValidationError) => Record<string, TranslationMessage>;
export { getYupInnerErrors };
