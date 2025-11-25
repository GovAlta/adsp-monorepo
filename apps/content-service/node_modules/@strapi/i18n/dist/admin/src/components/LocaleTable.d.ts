import type { Locale } from '../../../shared/contracts/locales';
type LocaleTableProps = {
    locales?: Locale[];
    canDelete?: boolean;
    canUpdate?: boolean;
    onDeleteLocale?: (locale: Locale) => void;
    onEditLocale?: (locale: Locale) => void;
};
declare const LocaleTable: ({ locales, canDelete, canUpdate }: LocaleTableProps) => import("react/jsx-runtime").JSX.Element;
export { LocaleTable };
export type { LocaleTableProps };
