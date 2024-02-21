FROM registry.redhat.io/rhel9/nodejs-20

ARG SERVICE
COPY . .

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

