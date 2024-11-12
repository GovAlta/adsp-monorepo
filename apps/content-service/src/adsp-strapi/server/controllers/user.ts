import type { EventService } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';
import { errors, yup, validateYupSchema } from '@strapi/utils';
import type { Context } from 'koa';
import { userRegistered } from '../events';

const userCreationSchema = yup
  .object()
  .shape({
    firstName: yup.string().trim().min(1),
    lastName: yup.string().optional(),
    email: yup.string().email().lowercase(),
    isEditor: yup.boolean().optional(),
  })
  .noUnknown();

const user = ({ strapi }: { strapi: Core.Strapi }) => ({
  async create(ctx: Context) {
    const tenantId = ctx.state.auth.credentials.tenantId;

    await validateYupSchema(userCreationSchema)(ctx.request.body);
    const { firstName, lastName, email, isEditor } = ctx.request.body;

    const userService = strapi.service('admin::user');
    const userAlreadyExists = await userService.exists({
      email,
    });

    if (userAlreadyExists) {
      throw new errors.ApplicationError('Email already taken');
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
    const eventService = await strapi.service('plugin::adsp-strapi.eventService') as EventService;
    eventService.send(
      userRegistered(tenantId, {
        email,
        firstName,
        lastName,
        registrationToken: createdUser.registrationToken,
        isEditor: !!isEditor,
      }),
    );
  },
});

export default user;
