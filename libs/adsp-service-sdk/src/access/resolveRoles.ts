interface Token {
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
}

export function resolveRoles(aud: string, { realm_access, resource_access }: Token): string[] {
  return Object.entries(resource_access || {}).reduce((roles, [client, clientRoles]) => {
    // Include client roles of the current service with unqualified names.
    // These roles are included in both qualified and unqualified forms.
    if (client === aud) {
      roles.push(...(clientRoles?.roles || []));
    }

    // Include all client roles with qualified names.
    roles.push(...(clientRoles?.roles?.map((clientRole) => `${client}:${clientRole}`) || []));

    return roles;
  }, realm_access?.roles || []);
}
