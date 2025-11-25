'use strict';

class Dialect {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    configure(conn) {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async initialize(_nativeConnection) {
    // noop
    }
    getTables() {
        throw new Error('getTables not implemented for this dialect');
    }
    getSqlType(type) {
        return type;
    }
    canAlterConstraints() {
        return true;
    }
    usesForeignKeys() {
        return false;
    }
    useReturning() {
        return false;
    }
    supportsUnsigned() {
        return false;
    }
    supportsOperator() {
        return true;
    }
    async startSchemaUpdate() {
    // noop
    }
    async endSchemaUpdate() {
    // noop
    }
    transformErrors(error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(error.message);
    }
    canAddIncrements() {
        return true;
    }
    /**
   * Get column type conversion SQL for complex type changes
   * Override in specific dialects to handle database-specific conversions
   * @param currentType - The current database data type
   * @param targetType - The target Strapi type
   * @returns Conversion SQL details or null if no special handling needed
   */ getColumnTypeConversionSQL(// eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentType, // eslint-disable-next-line @typescript-eslint/no-unused-vars
    targetType) {
        return null;
    }
    constructor(db, client){
        this.schemaInspector = {};
        this.db = db;
        this.client = client;
    }
}

module.exports = Dialect;
//# sourceMappingURL=dialect.js.map
