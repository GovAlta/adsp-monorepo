'use strict';

var constants = require('../constants.js');

const historyVersion = {
    uid: constants.HISTORY_VERSION_UID,
    tableName: 'strapi_history_versions',
    singularName: 'history-version',
    attributes: {
        id: {
            type: 'increments'
        },
        contentType: {
            type: 'string',
            column: {
                notNullable: true
            }
        },
        relatedDocumentId: {
            type: 'string',
            // TODO: notNullable should be true once history can record publish actions
            column: {
                notNullable: false
            }
        },
        locale: {
            type: 'string'
        },
        status: {
            type: 'enumeration',
            enum: [
                'draft',
                'published',
                'modified'
            ]
        },
        data: {
            type: 'json'
        },
        schema: {
            type: 'json'
        },
        createdAt: {
            type: 'datetime',
            default: ()=>new Date()
        },
        // FIXME: joinTable should be optional
        // @ts-expect-error database model is not yet updated to support useJoinTable
        createdBy: {
            type: 'relation',
            relation: 'oneToOne',
            target: 'admin::user',
            useJoinTable: false
        }
    }
};

exports.historyVersion = historyVersion;
//# sourceMappingURL=history-version.js.map
