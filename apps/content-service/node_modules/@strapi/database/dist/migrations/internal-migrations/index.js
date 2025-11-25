'use strict';

var _5_0_002DocumentId = require('./5.0.0-02-document-id.js');
var _5_0_001ConvertIdentifiersLongThanMaxLength = require('./5.0.0-01-convert-identifiers-long-than-max-length.js');
var _5_0_003Locale = require('./5.0.0-03-locale.js');
var _5_0_004PublishedAt = require('./5.0.0-04-published-at.js');
var _5_0_005DropSlugUniqueIndex = require('./5.0.0-05-drop-slug-unique-index.js');

/**
 * List of all the internal migrations. The array order will be the order in which they are executed.
 *
 * {
 *   name: 'some-name',
 *   async up(knex: Knex, db: Database) {},
 *   async down(knex: Knex, db: Database) {},
 * },
 */ const internalMigrations = [
    _5_0_001ConvertIdentifiersLongThanMaxLength.renameIdentifiersLongerThanMaxLength,
    _5_0_002DocumentId.createdDocumentId,
    _5_0_003Locale.createdLocale,
    _5_0_004PublishedAt.createdPublishedAt,
    _5_0_005DropSlugUniqueIndex.dropSlugFieldsIndex
];

exports.internalMigrations = internalMigrations;
//# sourceMappingURL=index.js.map
