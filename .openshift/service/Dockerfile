# FROM registry.redhat.io/rhel9/nodejs-24
FROM registry.access.redhat.com/ubi8/nodejs-24

ARG SERVICE
COPY . .

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js
