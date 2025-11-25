interface LocaleListCellProps {
    localizations: {
        locale: string;
    }[];
    locale: string;
}
declare const LocaleListCell: ({ locale: currentLocale, localizations }: LocaleListCellProps) => import("react/jsx-runtime").JSX.Element | null;
export { LocaleListCell };
export type { LocaleListCellProps };
