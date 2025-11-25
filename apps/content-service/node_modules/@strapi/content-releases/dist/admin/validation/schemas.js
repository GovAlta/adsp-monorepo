'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var dateFnsTz = require('date-fns-tz');
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

/**
 * FormikErrors type enforce us to always return a string as error.
 * We need these errors to be translated, so we need to create a hook to be able to use the formatMessage function.
 */ const RELEASE_SCHEMA = yup__namespace.object().shape({
    name: yup__namespace.string().trim().required(strapiAdmin.translatedErrors.required.id).nullable(),
    scheduledAt: yup__namespace.string().nullable(),
    isScheduled: yup__namespace.boolean().optional(),
    time: yup__namespace.string().when('isScheduled', {
        is: true,
        then: yup__namespace.string().trim().required(strapiAdmin.translatedErrors.required.id),
        otherwise: yup__namespace.string().nullable()
    }).test('time-in-future-if-today', 'content-releases.modal.form.time.has-passed', function(time) {
        const { date, timezone } = this.parent;
        if (!date || !timezone || !time) {
            return true;
        }
        // Timezone is in format "UTC&Europe/Paris", so we get the region part for the dates functions
        const region = timezone.split('&')[1];
        const selectedTime = dateFnsTz.zonedTimeToUtc(`${date} ${time}`, region);
        const now = new Date();
        return selectedTime > now;
    }),
    timezone: yup__namespace.string().when('isScheduled', {
        is: true,
        then: yup__namespace.string().required(strapiAdmin.translatedErrors.required.id).nullable(),
        otherwise: yup__namespace.string().nullable()
    }),
    date: yup__namespace.string().when('isScheduled', {
        is: true,
        then: yup__namespace.string().required(strapiAdmin.translatedErrors.required.id).nullable(),
        otherwise: yup__namespace.string().nullable()
    })
}).required().noUnknown();
const SETTINGS_SCHEMA = yup__namespace.object().shape({
    defaultTimezone: yup__namespace.string().nullable().default(null)
}).required().noUnknown();

exports.RELEASE_SCHEMA = RELEASE_SCHEMA;
exports.SETTINGS_SCHEMA = SETTINGS_SCHEMA;
//# sourceMappingURL=schemas.js.map
