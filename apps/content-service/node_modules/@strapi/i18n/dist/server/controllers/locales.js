'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');
var index = require('../utils/index.js');
var locales = require('../validation/locales.js');
var locale = require('../domain/locale.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var utils__namespace = /*#__PURE__*/_interopNamespaceDefault(utils);

const { setCreatorFields } = utils__namespace;
const { ApplicationError } = utils__namespace.errors;
const sanitizeLocale = (locale)=>{
    const model = strapi.getModel('plugin::i18n.locale');
    return strapi.contentAPI.sanitize.output(locale, model);
};
const controller = {
    async listLocales (ctx) {
        const localesService = index.getService('locales');
        const locales = await localesService.find();
        const sanitizedLocales = await sanitizeLocale(locales);
        ctx.body = await localesService.setIsDefault(sanitizedLocales);
    },
    async createLocale (ctx) {
        const { user } = ctx.state;
        const body = ctx.request.body;
        const { isDefault, ...localeToCreate } = body;
        await locales.validateCreateLocaleInput(body);
        const localesService = index.getService('locales');
        const existingLocale = await localesService.findByCode(body.code);
        if (existingLocale) {
            throw new ApplicationError('This locale already exists');
        }
        const localeToPersist = setCreatorFields({
            user
        })(locale.formatLocale(localeToCreate));
        const locale$1 = await localesService.create(localeToPersist);
        if (isDefault) {
            await localesService.setDefaultLocale(locale$1);
        }
        const sanitizedLocale = await sanitizeLocale(locale$1);
        ctx.body = await localesService.setIsDefault(sanitizedLocale);
    },
    async updateLocale (ctx) {
        const { user } = ctx.state;
        const { id } = ctx.params;
        const body = ctx.request.body;
        const { isDefault, ...updates } = body;
        await locales.validateUpdateLocaleInput(body);
        const localesService = index.getService('locales');
        const existingLocale = await localesService.findById(id);
        if (!existingLocale) {
            return ctx.notFound('locale.notFound');
        }
        const allowedParams = [
            'name'
        ];
        const cleanUpdates = setCreatorFields({
            user,
            isEdition: true
        })(fp.pick(allowedParams, updates));
        const updatedLocale = await localesService.update({
            id
        }, cleanUpdates);
        if (isDefault) {
            await localesService.setDefaultLocale(updatedLocale);
        }
        const sanitizedLocale = await sanitizeLocale(updatedLocale);
        ctx.body = await localesService.setIsDefault(sanitizedLocale);
    },
    async deleteLocale (ctx) {
        const { id } = ctx.params;
        const localesService = index.getService('locales');
        const existingLocale = await localesService.findById(id);
        if (!existingLocale) {
            return ctx.notFound('locale.notFound');
        }
        const defaultLocaleCode = await localesService.getDefaultLocale();
        if (existingLocale.code === defaultLocaleCode) {
            throw new ApplicationError('Cannot delete the default locale');
        }
        await localesService.delete({
            id
        });
        const sanitizedLocale = await sanitizeLocale(existingLocale);
        ctx.body = await localesService.setIsDefault(sanitizedLocale);
    }
};

module.exports = controller;
//# sourceMappingURL=locales.js.map
