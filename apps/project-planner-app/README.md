# Project planner app

### Running the app

Start the planner service on http://localhost:3381 (see `apps/project-planner-service/README.md`), then:

```
nx run project-planner-app:serve
```

### Test locally

```
http://localhost:4300
```

Sign-in uses the realm in `src/environments/environment.ts`. That realm needs a public client
`urn:ads:platform:project-planner-app` with redirect URI `http://localhost:4300/*` and web origin
`http://localhost:4300`.
