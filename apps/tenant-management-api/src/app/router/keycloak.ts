import { Router } from 'express';
import { createkcAdminClient } from '../../keycloak';

const router = Router();

router.get('/access', async (_req, res, next) => {
  try {
    const client = await createkcAdminClient();
    const users = await client.users.find();
    const roles = await client.roles.find();

    interface RoleUserMap {
      [key: string]: string[];
    }

    const userIds = users.map(user => user.id);
    const userRoles = roles.map(async (role) => {
      const usersWithRole = (await client.roles
        .findUsersWithRole({ name: role.name }))
        .filter(user => userIds.includes(user.id));
      return { roleId: role.id, users: usersWithRole.map((user) => user.id) };
    });

    Promise.all(userRoles).then((mapItems) => {
      const userRoleMap: RoleUserMap = {};
      mapItems.forEach(
        (userRole) => (userRoleMap[userRole['roleId']] = userRole['users'])
      );

      // add userId[] attribute to roles
      const rolesWithUsers = roles.map((role) => {
        return {
          ...role,
          userIds: userRoleMap[role.id] || [],
        };
      });

      res.json({
        users,
        roles: rolesWithUsers,
      });
    });
  } catch (err) {
    res.status(500);
    next(err);
  }
});

export default router;
