'use strict';

var path = require('path');
var utils = require('@strapi/utils');
var index = require('./schema-builder/index.js');

/**
 * Edit a category name and move components to the write folder
 */ const editCategory = async (name, infos)=>{
    const newName = utils.strings.nameToSlug(infos.name);
    // don't do anything the name doesn't change
    if (name === newName) return;
    if (!categoryExists(name)) {
        throw new utils.errors.ApplicationError('category not found');
    }
    if (categoryExists(newName)) {
        throw new utils.errors.ApplicationError('Name already taken');
    }
    const builder = index();
    builder.components.forEach((component)=>{
        const oldUID = component.uid;
        const newUID = `${newName}.${component.modelName}`;
        // only edit the components in this specific category
        if (component.category !== name) return;
        component.setUID(newUID).setDir(path.join(strapi.dirs.app.components, newName));
        builder.components.forEach((compo)=>{
            compo.updateComponent(oldUID, newUID);
        });
        builder.contentTypes.forEach((ct)=>{
            ct.updateComponent(oldUID, newUID);
        });
    });
    await builder.writeFiles();
    return newName;
};
/**
 * Deletes a category and its components
 */ const deleteCategory = async (name)=>{
    if (!categoryExists(name)) {
        throw new utils.errors.ApplicationError('category not found');
    }
    const builder = index();
    builder.components.forEach((component)=>{
        if (component.category === name) {
            builder.deleteComponent(component.uid);
        }
    });
    await builder.writeFiles();
};
/**
 * Checks if a category exists
 */ const categoryExists = (name)=>{
    const matchingIndex = Object.values(strapi.components).findIndex((component)=>component.category === name);
    return matchingIndex > -1;
};

exports.deleteCategory = deleteCategory;
exports.editCategory = editCategory;
//# sourceMappingURL=component-categories.js.map
