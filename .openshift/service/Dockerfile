# FROM registry.redhat.io/rhel9/nodejs-24
FROM quay.io/fedora/nodejs-24

ARG SERVICE
ENV SERVICE=${SERVICE}
ENV NODE_ENV=production
ENV INIT_WRAPPER=true

# Copy pre-built artifacts with correct ownership
COPY --chown=1001:0 node_modules ./node_modules
COPY --chown=1001:0 dist/apps/${SERVICE} ./dist/apps/${SERVICE}

CMD node dist/apps/${SERVICE}/main.js
