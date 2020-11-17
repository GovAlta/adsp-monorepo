FROM registry.access.redhat.com/ubi8/nodejs-12

ARG SERVICE
COPY . .

ENV SERVICE ${SERVICE}

CMD npm run -d service dist/apps/${SERVICE}/main.js
