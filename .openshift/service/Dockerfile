# FROM registry.redhat.io/rhel9/nodejs-24
FROM quay.io/fedora/nodejs-24

ARG SERVICE
COPY . .

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js
