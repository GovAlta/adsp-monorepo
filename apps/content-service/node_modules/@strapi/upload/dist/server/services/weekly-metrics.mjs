import { defaultTo } from 'lodash/fp';
import { add } from 'date-fns';
import { getWeeklyCronScheduleAt } from '../utils/cron.mjs';
import { FOLDER_MODEL_UID, FILE_MODEL_UID } from '../constants.mjs';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const getMetricsStoreValue = async ()=>{
    const value = await strapi.store.get({
        type: 'plugin',
        name: 'upload',
        key: 'metrics'
    });
    return defaultTo({}, value);
};
const setMetricsStoreValue = (value)=>strapi.store.set({
        type: 'plugin',
        name: 'upload',
        key: 'metrics',
        value
    });
var weeklyMetrics = (({ strapi: strapi1 })=>({
        async computeMetrics () {
            // Folder metrics
            // @ts-expect-error - no dynamic types for the metadata
            const pathColName = strapi1.db.metadata.get(FOLDER_MODEL_UID).attributes.path.columnName;
            const folderTable = strapi1.getModel(FOLDER_MODEL_UID).collectionName;
            let keepOnlySlashesSQLString = '??';
            const queryParams = [
                pathColName
            ];
            for(let i = 0; i < 10; i += 1){
                keepOnlySlashesSQLString = `REPLACE(${keepOnlySlashesSQLString}, ?, ?)`;
                queryParams.push(String(i), '');
            }
            /*
      The following query goal is to count the number of folders with depth 1, depth 2 etc.
      The query returns :
      [
        { depth: 1, occurence: 4 },
        { depth: 2, occurence: 2 },
        { depth: 3, occurence: 5 },
      ]

      The query is built as follow:
      1. In order to get the depth level of a folder:
        - we take their path
        - remove all numbers (by replacing 0123456789 by '', thus the 10 REPLACE in the query)
        - count the remaining `/`, which correspond to their depth (by using LENGTH)
        We now have, for each folder, its depth.
      2. In order to get the number of folders for each depth:
        - we group them by their depth and use COUNT(*)
    */ const res = await strapi1.db.getConnection(folderTable).select(strapi1.db.connection.raw(`LENGTH(${keepOnlySlashesSQLString}) AS depth, COUNT(*) AS occurence`, queryParams)).groupBy('depth');
            const folderLevelsArray = res.map((map)=>({
                    depth: Number(map.depth),
                    occurence: Number(map.occurence)
                })); // values can be strings depending on the database
            let product = 0;
            let folderNumber = 0;
            let maxDepth = 0;
            for (const folderLevel of folderLevelsArray){
                product += folderLevel.depth * folderLevel.occurence;
                folderNumber += folderLevel.occurence;
                if (folderLevel.depth > maxDepth) {
                    maxDepth = folderLevel.depth;
                }
            }
            const averageDepth = folderNumber !== 0 ? product / folderNumber : 0;
            let sumOfDeviation = 0;
            for (const folderLevel of folderLevelsArray){
                sumOfDeviation += Math.abs(folderLevel.depth - averageDepth) * folderLevel.occurence;
            }
            const averageDeviationDepth = folderNumber !== 0 ? sumOfDeviation / folderNumber : 0;
            // File metrics
            const assetNumber = await strapi1.db.query(FILE_MODEL_UID).count();
            return {
                assetNumber,
                folderNumber,
                averageDepth,
                maxDepth,
                averageDeviationDepth
            };
        },
        async sendMetrics () {
            const metrics = await this.computeMetrics();
            strapi1.telemetry.send('didSendUploadPropertiesOnceAWeek', {
                groupProperties: {
                    metrics
                }
            });
            const metricsInfoStored = await getMetricsStoreValue();
            await setMetricsStoreValue({
                ...metricsInfoStored,
                lastWeeklyUpdate: new Date().getTime()
            });
        },
        async ensureWeeklyStoredCronSchedule () {
            const metricsInfoStored = await getMetricsStoreValue();
            const { weeklySchedule: currentSchedule, lastWeeklyUpdate } = metricsInfoStored;
            const now = new Date();
            let weeklySchedule = currentSchedule;
            if (!weeklySchedule || !lastWeeklyUpdate || lastWeeklyUpdate + ONE_WEEK < now.getTime()) {
                weeklySchedule = getWeeklyCronScheduleAt(add(now, {
                    seconds: 15
                }));
                await setMetricsStoreValue({
                    ...metricsInfoStored,
                    weeklySchedule
                });
                return weeklySchedule;
            }
            return weeklySchedule;
        },
        async registerCron () {
            const weeklySchedule = await this.ensureWeeklyStoredCronSchedule();
            strapi1.cron.add({
                uploadWeekly: {
                    task: this.sendMetrics.bind(this),
                    options: weeklySchedule
                }
            });
        }
    }));

export { weeklyMetrics as default };
//# sourceMappingURL=weekly-metrics.mjs.map
