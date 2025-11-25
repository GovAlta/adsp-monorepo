'use strict';

var admin = require('@strapi/strapi/admin');
var yup = require('yup');
require('lodash/isEmpty');
var getTrad = require('../../../utils/getTrad.js');

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

const callbackLabel = {
    id: getTrad('PopUpForm.Providers.redirectURL.front-end.label'),
    defaultMessage: 'The redirect URL to your front-end app'
};
const callbackPlaceholder = {
    id: 'http://www.client-app.com',
    defaultMessage: 'http://www.client-app.com'
};
const enabledDescription = {
    id: getTrad('PopUpForm.Providers.enabled.description'),
    defaultMessage: "If disabled, users won't be able to use this provider."
};
const enabledLabel = {
    id: getTrad('PopUpForm.Providers.enabled.label'),
    defaultMessage: 'Enable'
};
const keyLabel = {
    id: getTrad('PopUpForm.Providers.key.label'),
    defaultMessage: 'Client ID'
};
const hintLabel = {
    id: getTrad('PopUpForm.Providers.redirectURL.label'),
    defaultMessage: 'The redirect URL to add in your {provider} application configurations'
};
const textPlaceholder = {
    id: getTrad('PopUpForm.Providers.key.placeholder'),
    defaultMessage: 'TEXT'
};
const secretLabel = {
    id: getTrad('PopUpForm.Providers.secret.label'),
    defaultMessage: 'Client Secret'
};
const CALLBACK_REGEX = /^$|^[a-z][a-z0-9+.-]*:\/\/[^\s/$.?#](?:[^\s]*[^\s/$.?#])?$/i;
const SUBDOMAIN_REGEX = /^(([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+)(:\d+)?(\/\S*)?$/i;
const forms = {
    email: {
        form: [
            [
                {
                    intlLabel: enabledLabel,
                    name: 'enabled',
                    type: 'bool',
                    description: enabledDescription,
                    size: 6
                }
            ]
        ],
        schema: yup__namespace.object().shape({
            enabled: yup__namespace.bool().required(admin.translatedErrors.required.id)
        })
    },
    providers: {
        form: [
            [
                {
                    intlLabel: enabledLabel,
                    name: 'enabled',
                    type: 'bool',
                    description: enabledDescription,
                    size: 6,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: keyLabel,
                    name: 'key',
                    type: 'text',
                    placeholder: textPlaceholder,
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: secretLabel,
                    name: 'secret',
                    type: 'text',
                    placeholder: textPlaceholder,
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: callbackLabel,
                    placeholder: callbackPlaceholder,
                    name: 'callback',
                    type: 'text',
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: hintLabel,
                    name: 'noName',
                    type: 'text',
                    validations: {},
                    size: 12,
                    disabled: true
                }
            ]
        ],
        schema: yup__namespace.object().shape({
            enabled: yup__namespace.bool().required(admin.translatedErrors.required.id),
            key: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            }),
            secret: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            }),
            callback: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().matches(CALLBACK_REGEX, admin.translatedErrors.regex.id).required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            })
        })
    },
    providersWithSubdomain: {
        form: [
            [
                {
                    intlLabel: enabledLabel,
                    name: 'enabled',
                    type: 'bool',
                    description: enabledDescription,
                    size: 6,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: keyLabel,
                    name: 'key',
                    type: 'text',
                    placeholder: textPlaceholder,
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: secretLabel,
                    name: 'secret',
                    type: 'text',
                    placeholder: textPlaceholder,
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: {
                        id: getTrad({
                            id: 'PopUpForm.Providers.jwksurl.label'
                        }),
                        defaultMessage: 'JWKS URL'
                    },
                    name: 'jwksurl',
                    type: 'text',
                    placeholder: textPlaceholder,
                    size: 12,
                    validations: {
                        required: false
                    }
                }
            ],
            [
                {
                    intlLabel: {
                        id: getTrad('PopUpForm.Providers.subdomain.label'),
                        defaultMessage: 'Host URI (Subdomain)'
                    },
                    name: 'subdomain',
                    type: 'text',
                    placeholder: {
                        id: getTrad('PopUpForm.Providers.subdomain.placeholder'),
                        defaultMessage: 'my.subdomain.com'
                    },
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: callbackLabel,
                    placeholder: callbackPlaceholder,
                    name: 'callback',
                    type: 'text',
                    size: 12,
                    validations: {
                        required: true
                    }
                }
            ],
            [
                {
                    intlLabel: hintLabel,
                    name: 'noName',
                    type: 'text',
                    validations: {},
                    size: 12,
                    disabled: true
                }
            ]
        ],
        schema: yup__namespace.object().shape({
            enabled: yup__namespace.bool().required(admin.translatedErrors.required.id),
            key: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            }),
            secret: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            }),
            subdomain: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().matches(SUBDOMAIN_REGEX, admin.translatedErrors.regex.id).required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            }),
            callback: yup__namespace.string().when('enabled', {
                is: true,
                then: yup__namespace.string().matches(CALLBACK_REGEX, admin.translatedErrors.regex.id).required(admin.translatedErrors.required.id),
                otherwise: yup__namespace.string()
            })
        })
    }
};

module.exports = forms;
//# sourceMappingURL=forms.js.map
