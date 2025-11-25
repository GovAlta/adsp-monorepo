'use strict';

var ForgotPassword = require('./components/ForgotPassword.js');
var ForgotPasswordSuccess = require('./components/ForgotPasswordSuccess.js');
var Oops = require('./components/Oops.js');
var Register = require('./components/Register.js');
var ResetPassword = require('./components/ResetPassword.js');

const FORMS = {
    'forgot-password': ForgotPassword.ForgotPassword,
    'forgot-password-success': ForgotPasswordSuccess.ForgotPasswordSuccess,
    // the `Component` attribute is set after all forms and CE/EE components are loaded, but since we
    // are here outside of a React component we can not use the hook directly
    login: ()=>null,
    oops: Oops.Oops,
    register: Register.Register,
    'register-admin': Register.Register,
    'reset-password': ResetPassword.ResetPassword,
    providers: ()=>null
};

exports.FORMS = FORMS;
//# sourceMappingURL=constants.js.map
