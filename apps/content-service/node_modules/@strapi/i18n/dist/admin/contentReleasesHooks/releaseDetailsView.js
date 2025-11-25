'use strict';

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

exports.addLocaleToReleasesHook = addLocaleToReleasesHook;
//# sourceMappingURL=releaseDetailsView.js.map
