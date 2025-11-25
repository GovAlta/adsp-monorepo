'use strict';

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

exports.__require = requireSchemaConfig;
//# sourceMappingURL=schema-config.js.map
