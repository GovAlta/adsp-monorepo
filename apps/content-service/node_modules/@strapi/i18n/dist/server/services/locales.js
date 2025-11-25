'use strict';

var fp = require('lodash/fp');
var index$1 = require('../constants/index.js');
var index = require('../utils/index.js');

const find = (params = {})=>strapi.db.query('plugin::i18n.locale').findMany({
        where: params
    });
const findById = (id)=>strapi.db.query('plugin::i18n.locale').findOne({
        where: {
            id
        }
    });
const findByCode = (code)=>strapi.db.query('plugin::i18n.locale').findOne({
        where: {
            code
        }
    });
const count = (params = {})=>strapi.db.query('plugin::i18n.locale').count({
        where: params
    });
const create = async (locale)=>{
    const result = await strapi.db.query('plugin::i18n.locale').create({
        data: locale
    });
    index.getService('metrics').sendDidUpdateI18nLocalesEvent();
    return result;
};
const update = async (params, updates)=>{
    const result = await strapi.db.query('plugin::i18n.locale').update({
        where: params,
        data: updates
    });
    index.getService('metrics').sendDidUpdateI18nLocalesEvent();
    return result;
};
const deleteFn = async ({ id })=>{
    const localeToDelete = await findById(id);
    if (localeToDelete) {
        await deleteAllLocalizedEntriesFor({
            locale: localeToDelete.code
        });
        const result = await strapi.db.query('plugin::i18n.locale').delete({
            where: {
                id
            }
        });
        index.getService('metrics').sendDidUpdateI18nLocalesEvent();
        return result;
    }
    return localeToDelete;
};
const setDefaultLocale = ({ code })=>index.getCoreStore().set({
        key: 'default_locale',
        value: code
    });
const getDefaultLocale = ()=>index.getCoreStore().get({
        key: 'default_locale'
    });
const setIsDefault = async (locales)=>{
    if (fp.isNil(locales)) {
        return locales;
    }
    const actualDefault = await getDefaultLocale();
    if (Array.isArray(locales)) {
        return locales.map((locale)=>({
                ...locale,
                isDefault: actualDefault === locale.code
            }));
    }
    // single locale
    return {
        ...locales,
        isDefault: actualDefault === locales.code
    };
};
const initDefaultLocale = async ()=>{
    const existingLocalesNb = await strapi.db.query('plugin::i18n.locale').count();
    if (existingLocalesNb === 0) {
        await create(index$1.DEFAULT_LOCALE);
        await setDefaultLocale({
            code: index$1.DEFAULT_LOCALE.code
        });
    }
};
const deleteAllLocalizedEntriesFor = async ({ locale })=>{
    const { isLocalizedContentType } = index.getService('content-types');
    const localizedModels = Object.values(strapi.contentTypes).filter(isLocalizedContentType);
    for (const model of localizedModels){
        // FIXME: delete many content & their associations
        await strapi.db.query(model.uid).deleteMany({
            where: {
                locale
            }
        });
    }
};
const locales = ()=>({
        find,
        findById,
        findByCode,
        create,
        update,
        count,
        setDefaultLocale,
        getDefaultLocale,
        setIsDefault,
        delete: deleteFn,
        initDefaultLocale
    });

module.exports = locales;
//# sourceMappingURL=locales.js.map
