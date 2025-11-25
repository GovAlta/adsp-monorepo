'use strict';

var cuid2 = require('@paralleldrive/cuid2');
var _ = require('lodash/fp');

const QUERIES = {
    async postgres (knex, params) {
        const res = await knex.raw(`
    SELECT :tableName:.id as id, string_agg(DISTINCT :inverseJoinColumn:::character varying, ',') as other_ids
    FROM :tableName:
    LEFT JOIN :joinTableName: ON :tableName:.id = :joinTableName:.:joinColumn:
    WHERE :tableName:.document_id IS NULL
    GROUP BY :tableName:.id, :joinTableName:.:joinColumn:
    LIMIT 1;
  `, params);
        return res.rows;
    },
    async mysql (knex, params) {
        const [res] = await knex.raw(`
    SELECT :tableName:.id as id, group_concat(DISTINCT :inverseJoinColumn:) as other_ids
    FROM :tableName:
    LEFT JOIN :joinTableName: ON :tableName:.id = :joinTableName:.:joinColumn:
    WHERE :tableName:.document_id IS NULL
    GROUP BY :tableName:.id, :joinTableName:.:joinColumn:
    LIMIT 1;
  `, params);
        return res;
    },
    async sqlite (knex, params) {
        return knex.raw(`
    SELECT :tableName:.id as id, group_concat(DISTINCT :inverseJoinColumn:) as other_ids
    FROM :tableName:
    LEFT JOIN :joinTableName: ON :tableName:.id = :joinTableName:.:joinColumn:
    WHERE :tableName:.document_id IS NULL
    GROUP BY :joinTableName:.:joinColumn:
    LIMIT 1;
    `, params);
    }
};
const getNextIdsToCreateDocumentId = async (db, knex, { joinColumn, inverseJoinColumn, tableName, joinTableName })=>{
    const res = await QUERIES[db.dialect.client](knex, {
        joinColumn,
        inverseJoinColumn,
        tableName,
        joinTableName
    });
    if (res.length > 0) {
        const row = res[0];
        const otherIds = row.other_ids ? row.other_ids.split(',').map((v)=>parseInt(v, 10)) : [];
        return [
            row.id,
            ...otherIds
        ];
    }
    return [];
};
// Migrate document ids for tables that have localizations
const migrateDocumentIdsWithLocalizations = async (db, knex, meta)=>{
    const singularName = meta.singularName.toLowerCase();
    const joinColumn = _.snakeCase(`${singularName}_id`);
    const inverseJoinColumn = _.snakeCase(`inv_${singularName}_id`);
    let ids;
    do {
        ids = await getNextIdsToCreateDocumentId(db, knex, {
            joinColumn,
            inverseJoinColumn,
            tableName: meta.tableName,
            joinTableName: _.snakeCase(`${meta.tableName}_localizations_links`)
        });
        if (ids.length > 0) {
            await knex(meta.tableName).update({
                document_id: cuid2.createId()
            }).whereIn('id', ids);
        }
    }while (ids.length > 0)
};
// Migrate document ids for tables that don't have localizations
const migrationDocumentIds = async (db, knex, meta)=>{
    let updatedRows;
    do {
        updatedRows = await knex(meta.tableName).update({
            document_id: cuid2.createId()
        }).whereIn('id', knex(meta.tableName).select('id').from(knex(meta.tableName).select('id').whereNull('document_id').limit(1).as('sub_query')));
    }while (updatedRows > 0)
};
const createDocumentIdColumn = async (knex, tableName)=>{
    await knex.schema.alterTable(tableName, (table)=>{
        table.string('document_id');
    });
};
const hasLocalizationsJoinTable = async (knex, tableName)=>{
    const joinTableName = _.snakeCase(`${tableName}_localizations_links`);
    return knex.schema.hasTable(joinTableName);
};
const createdDocumentId = {
    name: '5.0.0-02-created-document-id',
    async up (knex, db) {
        // do sth
        for (const meta of db.metadata.values()){
            const hasTable = await knex.schema.hasTable(meta.tableName);
            if (!hasTable) {
                continue;
            }
            if ('documentId' in meta.attributes) {
                // add column if doesn't exist
                const hasDocumentIdColumn = await knex.schema.hasColumn(meta.tableName, 'document_id');
                if (hasDocumentIdColumn) {
                    continue;
                }
                await createDocumentIdColumn(knex, meta.tableName);
                if (await hasLocalizationsJoinTable(knex, meta.tableName)) {
                    await migrateDocumentIdsWithLocalizations(db, knex, meta);
                } else {
                    await migrationDocumentIds(db, knex, meta);
                }
            }
        }
    },
    async down () {
        throw new Error('not implemented');
    }
};

exports.createdDocumentId = createdDocumentId;
//# sourceMappingURL=5.0.0-02-document-id.js.map
