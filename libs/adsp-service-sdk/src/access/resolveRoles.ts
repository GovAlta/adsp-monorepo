interface Token {
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
}

export function resolveRoles(aud: string, { realm_access, resource_access }: Token): string[] {
  return Object.entries(resource_access || {}).reduce(
    (roles, [client, clientRoles]) => [
      ...roles,
      ...((client === aud ? clientRoles?.roles : clientRoles?.roles.map((clientRole) => `${client}:${clientRole}`)) ||
        []),
    ],
    [...(realm_access?.roles || [])]
  );
}
