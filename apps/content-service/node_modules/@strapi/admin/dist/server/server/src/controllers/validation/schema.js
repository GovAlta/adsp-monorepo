'use strict';

var zod = require('zod');

// widths must be one of 4, 6, 8, 12
const WidthSchema = zod.z.union([
    zod.z.literal(4),
    zod.z.literal(6),
    zod.z.literal(8),
    zod.z.literal(12)
]);
const WidgetEntrySchema = zod.z.object({
    uid: zod.z.string().nonempty(),
    width: WidthSchema
}).strict();
const HomepageLayoutSchema = zod.z.object({
    version: zod.z.number().int().min(1),
    widgets: zod.z.array(WidgetEntrySchema).max(100),
    updatedAt: zod.z.string().datetime()
}).strict();
const HomepageLayoutWriteSchema = zod.z.object({
    version: zod.z.number().int().min(1).optional(),
    widgets: zod.z.array(WidgetEntrySchema).max(100),
    updatedAt: zod.z.string().datetime().optional()
}).strict();

exports.HomepageLayoutSchema = HomepageLayoutSchema;
exports.HomepageLayoutWriteSchema = HomepageLayoutWriteSchema;
exports.WidthSchema = WidthSchema;
//# sourceMappingURL=schema.js.map
