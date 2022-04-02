FROM registry.access.redhat.com/ubi8/nodejs-16

ARG SERVICE
COPY . .

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

