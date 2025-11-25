'use strict';

var semver = require('semver');
var fp = require('lodash/fp');
var workflows = require('../constants/workflows.js');

function checkVersionThreshold(startVersion, currentVersion, thresholdVersion) {
    return semver.gte(currentVersion, thresholdVersion) && semver.lt(startVersion, thresholdVersion);
}
/**
 * Shorten strapi stage name
 */ async function migrateStageAttribute({ oldContentTypes, contentTypes }) {
    const getRWVersion = fp.getOr('0.0.0', `${workflows.STAGE_MODEL_UID}.options.version`);
    const oldRWVersion = getRWVersion(oldContentTypes);
    const currentRWVersion = getRWVersion(contentTypes);
    checkVersionThreshold(oldRWVersion, currentRWVersion, '1.1.0');
// TODO: Find tables with something else than `findTables` function
// if (migrationNeeded) {
//   const oldAttributeTableName = 'strapi_review_workflows_stage';
//   const newAttributeTableName = 'strapi_stage';
//   // const tables = await findTables({ strapi }, new RegExp(oldAttributeTableName));
//   await async.map(tables, async (tableName: string) => {
//     const newTableName = tableName.replace(oldAttributeTableName, newAttributeTableName);
//     const alreadyHasNextTable = await strapi.db.connection.schema.hasTable(newTableName);
//     // The table can be already created but empty. In order to rename the old one, we need to drop the previously created empty one.
//     if (alreadyHasNextTable) {
//       const dataInTable = await strapi.db.connection(newTableName).select().limit(1);
//       if (!dataInTable.length) {
//         await strapi.db.connection.schema.dropTable(newTableName);
//       }
//     }
//     try {
//       await strapi.db.connection.schema.renameTable(tableName, newTableName);
//     } catch (e: any) {
//       strapi.log.warn(
//         `An error occurred during the migration of ${tableName} table to ${newTableName}.\nIf ${newTableName} already exists, migration can't be done automatically.`
//       );
//       strapi.log.warn(e.message);
//     }
//   });
// }
}

module.exports = migrateStageAttribute;
//# sourceMappingURL=shorten-stage-attribute.js.map
