import { FormErrors } from '@strapi/admin/strapi-admin';
import { Locale } from '../../../shared/contracts/locales';
import { LocaleStatus } from './CMHeaderActions';
interface BulkLocaleActionModalProps {
    rows: LocaleStatus[];
    headers: {
        label: string;
        name: string;
    }[];
    localesMetadata: Locale[];
    validationErrors?: FormErrors;
    action: 'bulk-publish' | 'bulk-unpublish';
}
declare const BulkLocaleActionModal: ({ headers, rows, localesMetadata, validationErrors, action, }: BulkLocaleActionModalProps) => import("react/jsx-runtime").JSX.Element;
export { BulkLocaleActionModal };
export type { BulkLocaleActionModalProps };
