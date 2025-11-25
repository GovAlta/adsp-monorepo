/**
 * Object containing error messages for input validations.
 * @property {Object} email - Error message for invalid email.
 * @property {string} email.id - Identifier for the error message.
 * @property {string} email.defaultMessage - Default error message for invalid email.
 * @property {Object} json - Error message for invalid JSON format.
 * @property {string} json.id - Identifier for the error message.
 * @property {string} json.defaultMessage - Default error message for invalid JSON format.
 * @property {Object} lowercase - Error message for non-lowercase string.
 * @property {string} lowercase.id - Identifier for the error message.
 * @property {string} lowercase.defaultMessage - Default error message for non-lowercase string.
 * @property {Object} max - Error message for value exceeding maximum.
 * @property {string} max.id - Identifier for the error message.
 * @property {string} max.defaultMessage - Default error message for value exceeding maximum.
 * @property {Object} maxLength - Error message for string length exceeding maximum.
 * @property {string} maxLength.id - Identifier for the error message.
 * @property {string} maxLength.defaultMessage - Default error message for string length exceeding maximum.
 * @property {Object} min - Error message for value less than minimum.
 * @property {string} min.id - Identifier for the error message.
 * @property {string} min.defaultMessage - Default error message for value less than minimum.
 * @property {Object} minLength - Error message for string length less than minimum.
 * @property {string} minLength.id - Identifier for the error message.
 * @property {string} minLength.defaultMessage - Default error message for string length less than minimum.
 * @property {Object} regex - Error message for value not matching regex pattern.
 * @property {string} regex.id - Identifier for the error message.
 * @property {string} regex.defaultMessage - Default error message for value not matching regex pattern.
 * @property {Object} required - Error message for required value.
 * @property {string} required.id - Identifier for the error message.
 * @property {string} required.defaultMessage - Default error message for required value.
 * @property {Object} string - Error message for non-string value.
 * @property {string} string.id - Identifier for the error message.
 * @property {string} string.defaultMessage - Default error message for non-string value.
 * @property {Object} unique - Error message for non-unique value.
 * @property {string} unique.id - Identifier for the error message.
 * @property {string} unique.defaultMessage - Default error message for non-unique value.
 * @property {Object} integer - Error message for non-integer value.
 * @property {string} integer.id - Identifier for the error message.
 * @property {string} integer.defaultMessage - Default error message for non-integer value.
 */
declare const errorsTrads: {
    readonly email: {
        readonly id: "components.Input.error.validation.email";
        readonly defaultMessage: "This is not a valid email.";
    };
    readonly json: {
        readonly id: "components.Input.error.validation.json";
        readonly defaultMessage: "This doesn't match the JSON format";
    };
    readonly lowercase: {
        readonly id: "components.Input.error.validation.lowercase";
        readonly defaultMessage: "The value must be a lowercase string";
    };
    readonly max: {
        readonly id: "components.Input.error.validation.max";
        readonly defaultMessage: "The value is too high (max: {max}).";
    };
    readonly maxLength: {
        readonly id: "components.Input.error.validation.maxLength";
        readonly defaultMessage: "The value is too long (max: {max}).";
    };
    readonly min: {
        readonly id: "components.Input.error.validation.min";
        readonly defaultMessage: "The value is too low (min: {min}).";
    };
    readonly minLength: {
        readonly id: "components.Input.error.validation.minLength";
        readonly defaultMessage: "The value is too short (min: {min}).";
    };
    readonly regex: {
        readonly id: "components.Input.error.validation.regex";
        readonly defaultMessage: "The value does not match the regex.";
    };
    readonly required: {
        readonly id: "components.Input.error.validation.required";
        readonly defaultMessage: "This value is required.";
    };
    readonly string: {
        readonly id: "components.Input.error.validation.string";
        readonly defaultMessage: "This is not a valid string.";
    };
    readonly unique: {
        readonly id: "components.Input.error.validation.unique";
        readonly defaultMessage: "This value is already used.";
    };
    readonly integer: {
        readonly id: "component.Input.error.validation.integer";
        readonly defaultMessage: "The value must be an integer";
    };
};
export { errorsTrads as translatedErrors };
