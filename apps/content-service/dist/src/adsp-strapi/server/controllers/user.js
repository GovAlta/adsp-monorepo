"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adsp_service_sdk_1 = require("@abgov/adsp-service-sdk");
const utils_1 = require("@strapi/utils");
const events_1 = require("../events");
const userCreationSchema = utils_1.yup
    .object()
    .shape({
    firstName: utils_1.yup.string().trim().min(1),
    lastName: utils_1.yup.string().optional(),
    email: utils_1.yup.string().email().lowercase(),
    isEditor: utils_1.yup.boolean().optional(),
})
    .noUnknown();
const user = ({ strapi }) => ({
    async create(ctx) {
        const tenantId = ctx.state.auth.credentials.tenantId;
        await (0, utils_1.validateYupSchema)(userCreationSchema)(ctx.request.body);
        const { firstName, lastName, email, isEditor } = ctx.request.body;
        const userService = strapi.service('admin::user');
        const userAlreadyExists = await userService.exists({
            email,
        });
        if (userAlreadyExists) {
            throw new utils_1.errors.ApplicationError('Email already taken');
        }
        const createdUser = await userService.create({
            firstname: firstName,
            lastname: lastName,
            email,
            roles: [isEditor ? '2' : '3'],
            tenantId: tenantId.toString(),
        });
        const userInfo = userService.sanitizeUser(createdUser);
        // Send 201 created
        ctx.created({ data: { ...userInfo, registrationToken: createdUser.registrationToken } });
        // Complete registration at /admin/auth/register?registrationToken=<registrationToken>
        const directory = (await strapi.service('plugin::adsp-strapi.directory'));
        const contentServiceUrl = await directory.getServiceUrl((0, adsp_service_sdk_1.adspId) `urn:ads:platform:content-service`);
        const eventService = (await strapi.service('plugin::adsp-strapi.eventService'));
        eventService.send((0, events_1.userRegistered)(tenantId, {
            email,
            firstName,
            lastName,
            registrationUrl: new URL(`/admin/auth/register?registrationToken=${createdUser.registrationToken}`, contentServiceUrl).href,
            isEditor: !!isEditor,
        }));
    },
});
exports.default = user;
//# sourceMappingURL=user.js.map