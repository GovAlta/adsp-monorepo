'use strict';

var path = require('path');
var _ = require('lodash');
var pluralize = require('pluralize');
var utils = require('@strapi/utils');
var attributes = require('../../utils/attributes.js');
var schemaHandler = require('./schema-handler.js');

const { ApplicationError } = utils.errors;
function createComponentBuilder() {
    return {
        createComponentUID ({ category, displayName }) {
            return `${utils.strings.nameToSlug(category)}.${utils.strings.nameToSlug(displayName)}`;
        },
        createNewComponentUIDMap (components) {
            return components.reduce((uidMap, component)=>{
                uidMap[component.tmpUID] = this.createComponentUID(component);
                return uidMap;
            }, {});
        },
        createComponentAttributes (uid, attributes) {
            if (!this.components.has(uid)) {
                throw new ApplicationError('component.notFound');
            }
            return this.components.get(uid).setAttributes(this.convertAttributes(attributes));
        },
        /**
     * create a component in the tmpComponent map
     */ createComponent (infos) {
            if (infos.uid && infos.uid !== this.createComponentUID(infos)) {
                throw new ApplicationError('component.invalidUID');
            }
            const uid = infos.uid ?? this.createComponentUID(infos);
            if (this.components.has(uid)) {
                throw new ApplicationError('component.alreadyExists');
            }
            const handler = schemaHandler({
                dir: path.join(strapi.dirs.app.components, utils.strings.nameToSlug(infos.category)),
                filename: `${utils.strings.nameToSlug(infos.displayName)}.json`
            });
            // TODO: create a utility for this
            // Duplicate in admin/src/components/FormModal/forms/utils/createCollectionName.ts
            const collectionName = `components_${utils.strings.nameToCollectionName(infos.category)}_${utils.strings.nameToCollectionName(pluralize(infos.displayName))}`;
            this.components.forEach((compo)=>{
                if (compo.schema.collectionName === collectionName) {
                    throw new ApplicationError('component.alreadyExists');
                }
            });
            handler.setUID(uid).set('collectionName', collectionName).set([
                'info',
                'displayName'
            ], infos.displayName).set([
                'info',
                'icon'
            ], infos.icon).set([
                'info',
                'description'
            ], infos.description).set('pluginOptions', infos.pluginOptions).set('config', infos.config);
            if (this.components.size === 0) {
                strapi.telemetry.send('didCreateFirstComponent');
            } else {
                strapi.telemetry.send('didCreateComponent');
            }
            this.components.set(uid, handler);
            this.createComponentAttributes(uid, infos.attributes);
            return handler;
        },
        /**
     * create a component in the tmpComponent map
     */ editComponent (infos) {
            const { uid } = infos;
            if (!this.components.has(uid)) {
                throw new utils.errors.ApplicationError('component.notFound');
            }
            const component = this.components.get(uid);
            const [, nameUID] = uid.split('.');
            const newCategory = utils.strings.nameToSlug(infos.category);
            const newUID = `${newCategory}.${nameUID}`;
            if (newUID !== uid && this.components.has(newUID)) {
                throw new utils.errors.ApplicationError('component.edit.alreadyExists');
            }
            const newDir = path.join(strapi.dirs.app.components, newCategory);
            const oldAttributes = component.schema.attributes;
            const newAttributes = _.omitBy(infos.attributes, (attr, key)=>{
                return _.has(oldAttributes, key) && !attributes.isConfigurable(oldAttributes[key]);
            });
            component.setUID(newUID).setDir(newDir).set([
                'info',
                'displayName'
            ], infos.displayName).set([
                'info',
                'icon'
            ], infos.icon).set([
                'info',
                'description'
            ], infos.description).set('pluginOptions', infos.pluginOptions).setAttributes(this.convertAttributes(newAttributes));
            if (newUID !== uid) {
                this.components.forEach((compo)=>{
                    compo.updateComponent(uid, newUID);
                });
                this.contentTypes.forEach((ct)=>{
                    ct.updateComponent(uid, newUID);
                });
            }
            return component;
        },
        deleteComponent (uid) {
            if (!this.components.has(uid)) {
                throw new utils.errors.ApplicationError('component.notFound');
            }
            this.components.forEach((compo)=>{
                compo.removeComponent(uid);
            });
            this.contentTypes.forEach((ct)=>{
                ct.removeComponent(uid);
            });
            return this.components.get(uid).delete();
        }
    };
}

module.exports = createComponentBuilder;
//# sourceMappingURL=component-builder.js.map
