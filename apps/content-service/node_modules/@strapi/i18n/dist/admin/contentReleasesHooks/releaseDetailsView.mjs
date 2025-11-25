const addLocaleToReleasesHook = ({ displayedHeaders = [] })=>{
    return {
        displayedHeaders: [
            ...displayedHeaders,
            {
                label: {
                    id: 'content-releases.page.ReleaseDetails.table.header.label.locale',
                    defaultMessage: 'locale'
                },
                name: 'locale'
            }
        ],
        hasI18nEnabled: true
    };
};

export { addLocaleToReleasesHook };
//# sourceMappingURL=releaseDetailsView.mjs.map
