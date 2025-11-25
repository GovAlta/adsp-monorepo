declare const SORT_TYPES: {
    readonly 'name:asc': {
        readonly selected: {
            readonly id: "admin.pages.MarketPlacePage.sort.alphabetical.selected";
            readonly defaultMessage: "Sort by alphabetical order";
        };
        readonly option: {
            readonly id: "admin.pages.MarketPlacePage.sort.alphabetical";
            readonly defaultMessage: "Alphabetical order";
        };
    };
    readonly 'submissionDate:desc': {
        readonly selected: {
            readonly id: "admin.pages.MarketPlacePage.sort.newest.selected";
            readonly defaultMessage: "Sort by newest";
        };
        readonly option: {
            readonly id: "admin.pages.MarketPlacePage.sort.newest";
            readonly defaultMessage: "Newest";
        };
    };
    readonly 'githubStars:desc': {
        readonly selected: {
            readonly id: "admin.pages.MarketPlacePage.sort.githubStars.selected";
            readonly defaultMessage: "Sort by GitHub stars";
        };
        readonly option: {
            readonly id: "admin.pages.MarketPlacePage.sort.githubStars";
            readonly defaultMessage: "Number of GitHub stars";
        };
    };
    readonly 'npmDownloads:desc': {
        readonly selected: {
            readonly id: "admin.pages.MarketPlacePage.sort.npmDownloads.selected";
            readonly defaultMessage: "Sort by npm downloads";
        };
        readonly option: {
            readonly id: "admin.pages.MarketPlacePage.sort.npmDownloads";
            readonly defaultMessage: "Number of downloads";
        };
    };
};
interface SortSelectProps {
    sortQuery: keyof typeof SORT_TYPES;
    handleSelectChange: (payload: {
        sort: string;
    }) => void;
}
declare const SortSelect: ({ sortQuery, handleSelectChange }: SortSelectProps) => import("react/jsx-runtime").JSX.Element;
export { SortSelect };
export type { SortSelectProps };
