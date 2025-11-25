interface AppendSearchParamsToUrlProps {
    url?: string;
    params?: Record<string, string | null | undefined> | string;
}
declare const appendSearchParamsToUrl: ({ url, params }: AppendSearchParamsToUrlProps) => string | undefined;
export { appendSearchParamsToUrl };
