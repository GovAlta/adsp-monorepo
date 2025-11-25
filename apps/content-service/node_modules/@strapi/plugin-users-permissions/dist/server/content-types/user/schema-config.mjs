var schemaConfig;
var hasRequiredSchemaConfig;
function requireSchemaConfig() {
    if (hasRequiredSchemaConfig) return schemaConfig;
    hasRequiredSchemaConfig = 1;
    schemaConfig = {
        attributes: {
            resetPasswordToken: {
                hidden: true
            },
            confirmationToken: {
                hidden: true
            },
            provider: {
                hidden: true
            }
        }
    };
    return schemaConfig;
}

export { requireSchemaConfig as __require };
//# sourceMappingURL=schema-config.mjs.map
