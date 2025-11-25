import { enable as enableDraftAndPublish, disable as disableDraftAndPublish } from './draft-publish.mjs';
import { enable as enableFirstPublishedAt } from './first-published-at.mjs';
import { enable as enableI18n, disable as disableI18n } from './i18n.mjs';

const enable = async ({ oldContentTypes, contentTypes })=>{
    await enableI18n({
        oldContentTypes,
        contentTypes
    });
    await enableDraftAndPublish({
        oldContentTypes,
        contentTypes
    });
    await enableFirstPublishedAt({
        oldContentTypes,
        contentTypes
    });
};
const disable = async ({ oldContentTypes, contentTypes })=>{
    await disableI18n({
        oldContentTypes,
        contentTypes
    });
    await disableDraftAndPublish({
        oldContentTypes,
        contentTypes
    });
};

export { disable, enable };
//# sourceMappingURL=index.mjs.map
