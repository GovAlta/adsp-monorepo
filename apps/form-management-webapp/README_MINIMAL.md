# Minimal Keycloak App (Login → Dashboard → Logout)

This is a pruned version of the webapp that retains Keycloak-based authentication and a minimal dashboard.

## Routes
- `/login` — Keycloak login landing
- `/login-redirect` — Keycloak redirect handler
- `/logout-redirect` — Clears local state and returns to `/`
- `/*` — Private app with a minimal dashboard saying "Welcome to Dashboard"

Other admin/service pages and heavy assets have been removed.