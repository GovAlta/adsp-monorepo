'use strict';

var fp = require('lodash/fp');
var index = require('../domain/content-type/index.js');
var namespace = require('./namespace.js');

const validateKeySameToSingularName = (contentTypes)=>{
    for (const ctName of Object.keys(contentTypes)){
        const contentType = contentTypes[ctName];
        if (ctName !== contentType.schema.info.singularName) {
            throw new Error(`The key of the content-type should be the same as its singularName. Found ${ctName} and ${contentType.schema.info.singularName}.`);
        }
    }
};
const contentTypesRegistry = ()=>{
    const contentTypes = {};
    return {
        /**
     * Returns this list of registered contentTypes uids
     */ keys () {
            return Object.keys(contentTypes);
        },
        /**
     * Returns the instance of a contentType. Instantiate the contentType if not already done
     */ get (uid) {
            return contentTypes[uid];
        },
        /**
     * Returns a map with all the contentTypes in a namespace
     */ getAll (namespace$1) {
            return fp.pickBy((_, uid)=>namespace.hasNamespace(uid, namespace$1))(contentTypes);
        },
        /**
     * Registers a contentType
     */ set (uid, contentType) {
            contentTypes[uid] = contentType;
            return this;
        },
        /**
     * Registers a map of contentTypes for a specific namespace
     */ add (namespace$1, newContentTypes) {
            validateKeySameToSingularName(newContentTypes);
            for (const rawCtName of Object.keys(newContentTypes)){
                const uid = namespace.addNamespace(rawCtName, namespace$1);
                if (fp.has(uid, contentTypes)) {
                    throw new Error(`Content-type ${uid} has already been registered.`);
                }
                contentTypes[uid] = index.createContentType(uid, newContentTypes[rawCtName]);
            }
        },
        /**
     * Wraps a contentType to extend it
     */ extend (ctUID, extendFn) {
            const currentContentType = this.get(ctUID);
            if (!currentContentType) {
                throw new Error(`Content-Type ${ctUID} doesn't exist`);
            }
            extendFn(currentContentType);
            return this;
        }
    };
};

module.exports = contentTypesRegistry;
//# sourceMappingURL=content-types.js.map
