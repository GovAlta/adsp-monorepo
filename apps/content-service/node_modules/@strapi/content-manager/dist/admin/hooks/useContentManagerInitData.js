'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var qs = require('qs');
var reactIntl = require('react-intl');
var collections = require('../constants/collections.js');
var hooks$1 = require('../constants/hooks.js');
var app = require('../modules/app.js');
var hooks = require('../modules/hooks.js');
var contentTypes = require('../services/contentTypes.js');
var init = require('../services/init.js');
var translations = require('../utils/translations.js');

const { MUTATE_COLLECTION_TYPES_LINKS, MUTATE_SINGLE_TYPES_LINKS } = hooks$1.HOOKS;
const useContentManagerInitData = ()=>{
    const { toggleNotification } = strapiAdmin.useNotification();
    const dispatch = hooks.useTypedDispatch();
    const runHookWaterfall = strapiAdmin.useStrapiApp('useContentManagerInitData', (state)=>state.runHookWaterfall);
    const { notifyStatus } = designSystem.useNotifyAT();
    const { formatMessage } = reactIntl.useIntl();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler(translations.getTranslation);
    const checkUserHasPermissions = strapiAdmin.useAuth('useContentManagerInitData', (state)=>state.checkUserHasPermissions);
    const state = hooks.useTypedSelector((state)=>state['content-manager'].app);
    const initialDataQuery = init.useGetInitialDataQuery(undefined, {
        /**
     * TODO: remove this when the CTB has been refactored to use redux-toolkit-query
     * and it can invalidate the cache on mutation
     */ refetchOnMountOrArgChange: true
    });
    React.useEffect(()=>{
        if (initialDataQuery.data) {
            notifyStatus(formatMessage({
                id: translations.getTranslation('App.schemas.data-loaded'),
                defaultMessage: 'The schemas have been successfully loaded.'
            }));
        }
    }, [
        formatMessage,
        initialDataQuery.data,
        notifyStatus
    ]);
    React.useEffect(()=>{
        if (initialDataQuery.error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(initialDataQuery.error)
            });
        }
    }, [
        formatAPIError,
        initialDataQuery.error,
        toggleNotification
    ]);
    const contentTypeSettingsQuery = contentTypes.useGetAllContentTypeSettingsQuery();
    React.useEffect(()=>{
        if (contentTypeSettingsQuery.error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(contentTypeSettingsQuery.error)
            });
        }
    }, [
        formatAPIError,
        contentTypeSettingsQuery.error,
        toggleNotification
    ]);
    const formatData = async (components, contentTypes, fieldSizes, contentTypeConfigurations)=>{
        /**
     * We group these by the two types we support. We do with an object because we can use default
     * values of arrays to make sure we always have an array to manipulate further on if, for example,
     * a user has not made any single types.
     *
     * This means we have to manually add new content types to this hook if we add a new type – but
     * the safety is worth it.
     */ const { collectionType: collectionTypeLinks, singleType: singleTypeLinks } = contentTypes.reduce((acc, model)=>{
            acc[model.kind].push(model);
            return acc;
        }, {
            collectionType: [],
            singleType: []
        });
        const collectionTypeSectionLinks = generateLinks(collectionTypeLinks, 'collectionTypes', contentTypeConfigurations);
        const singleTypeSectionLinks = generateLinks(singleTypeLinks, 'singleTypes');
        // Collection Types verifications
        const collectionTypeLinksPermissions = await Promise.all(collectionTypeSectionLinks.map(({ permissions })=>checkUserHasPermissions(permissions)));
        const authorizedCollectionTypeLinks = collectionTypeSectionLinks.filter((_, index)=>collectionTypeLinksPermissions[index].length > 0);
        // Single Types verifications
        const singleTypeLinksPermissions = await Promise.all(singleTypeSectionLinks.map(({ permissions })=>checkUserHasPermissions(permissions)));
        const authorizedSingleTypeLinks = singleTypeSectionLinks.filter((_, index)=>singleTypeLinksPermissions[index].length > 0);
        const { ctLinks } = runHookWaterfall(MUTATE_COLLECTION_TYPES_LINKS, {
            ctLinks: authorizedCollectionTypeLinks,
            models: contentTypes
        });
        const { stLinks } = runHookWaterfall(MUTATE_SINGLE_TYPES_LINKS, {
            stLinks: authorizedSingleTypeLinks,
            models: contentTypes
        });
        dispatch(app.setInitialData({
            authorizedCollectionTypeLinks: ctLinks,
            authorizedSingleTypeLinks: stLinks,
            components,
            contentTypeSchemas: contentTypes,
            fieldSizes
        }));
    };
    React.useEffect(()=>{
        if (initialDataQuery.data && contentTypeSettingsQuery.data) {
            formatData(initialDataQuery.data.components, initialDataQuery.data.contentTypes, initialDataQuery.data.fieldSizes, contentTypeSettingsQuery.data);
        }
    }, [
        initialDataQuery.data,
        contentTypeSettingsQuery.data
    ]);
    return {
        ...state
    };
};
const generateLinks = (links, type, configurations = [])=>{
    return links.filter((link)=>link.isDisplayed).map((link)=>{
        const collectionTypesPermissions = [
            {
                action: 'plugin::content-manager.explorer.create',
                subject: link.uid
            },
            {
                action: 'plugin::content-manager.explorer.read',
                subject: link.uid
            }
        ];
        const singleTypesPermissions = [
            {
                action: 'plugin::content-manager.explorer.read',
                subject: link.uid
            }
        ];
        const permissions = type === 'collectionTypes' ? collectionTypesPermissions : singleTypesPermissions;
        const currentContentTypeConfig = configurations.find(({ uid })=>uid === link.uid);
        let search = null;
        if (currentContentTypeConfig) {
            const searchParams = {
                page: 1,
                pageSize: currentContentTypeConfig.settings.pageSize,
                sort: `${currentContentTypeConfig.settings.defaultSortBy}:${currentContentTypeConfig.settings.defaultSortOrder}`
            };
            search = qs.stringify(searchParams, {
                encode: false
            });
        }
        return {
            permissions,
            search,
            kind: link.kind,
            title: link.info.displayName,
            to: `/content-manager/${link.kind === 'collectionType' ? collections.COLLECTION_TYPES : collections.SINGLE_TYPES}/${link.uid}`,
            uid: link.uid,
            // Used for the list item key in the helper plugin
            name: link.uid,
            isDisplayed: link.isDisplayed
        };
    });
};

exports.useContentManagerInitData = useContentManagerInitData;
//# sourceMappingURL=useContentManagerInitData.js.map
