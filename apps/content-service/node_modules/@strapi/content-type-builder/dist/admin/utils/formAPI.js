'use strict';

var cloneDeep = require('lodash/cloneDeep');
var get = require('lodash/get');
var yup = require('yup');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const formsAPI = {
    components: {
        inputs: {},
        add ({ id, component }) {
            if (!this.inputs[id]) {
                this.inputs[id] = component;
            }
        }
    },
    types: {
        attribute: {
        },
        contentType: {
            validators: [],
            form: {
                advanced: [],
                base: []
            }
        },
        component: {
            validators: [],
            form: {
                advanced: [],
                base: []
            }
        }
    },
    contentTypeSchemaMutations: [],
    addContentTypeSchemaMutation (cb) {
        this.contentTypeSchemaMutations.push(cb);
    },
    extendContentType ({ validator, form: { advanced, base } }) {
        const { contentType } = this.types;
        if (validator) {
            contentType.validators.push(validator);
        }
        contentType.form.advanced.push(advanced);
        contentType.form.base.push(base);
    },
    extendFields (fields, { validator, form: { advanced, base } }) {
        const formType = this.types.attribute;
        fields.forEach((field)=>{
            if (!formType[field]) {
                formType[field] = {
                    validators: [],
                    form: {
                        advanced: [],
                        base: []
                    }
                };
            }
            if (validator) {
                formType[field].validators.push(validator);
            }
            formType[field].form.advanced.push(advanced);
            formType[field].form.base.push(base);
        });
    },
    getAdvancedForm (target, props = null) {
        const sectionsToAdd = get(this.types, [
            ...target,
            'form',
            'advanced'
        ], []).reduce((acc, current)=>{
            const sections = current(props);
            return [
                ...acc,
                ...sections
            ];
        }, []);
        return sectionsToAdd;
    },
    makeCustomFieldValidator (attributeShape, validator, ...validatorArgs) {
        // When no validator, return the attribute shape
        if (!validator) return attributeShape;
        // Otherwise extend the shape with the provided validator
        return attributeShape.shape({
            options: yup__namespace.object().shape(validator(validatorArgs))
        });
    },
    makeValidator (target, initShape, ...args) {
        const validators = get(this.types, [
            ...target,
            'validators'
        ], []);
        const pluginOptionsShape = validators.reduce((acc, current)=>{
            const pluginOptionShape = current(args);
            return {
                ...acc,
                ...pluginOptionShape
            };
        }, {});
        return initShape.shape({
            pluginOptions: yup__namespace.object().shape(pluginOptionsShape)
        });
    },
    mutateContentTypeSchema (data, initialData) {
        let enhancedData = cloneDeep(data);
        const refData = cloneDeep(initialData);
        this.contentTypeSchemaMutations.forEach((cb)=>{
            enhancedData = cb(enhancedData, refData);
        });
        return enhancedData;
    }
};

exports.formsAPI = formsAPI;
//# sourceMappingURL=formAPI.js.map
